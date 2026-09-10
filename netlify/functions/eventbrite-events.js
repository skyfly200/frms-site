// Netlify Function: fetch upcoming Eventbrite events for the home page.
//
// Returns a small, pre-formatted JSON payload the home page renders into
// event cards (name, date, time, venue, summary, ticket URL). Using the API
// avoids the Eventbrite checkout widget (tickets only) and iframe embedding
// (blocked by X-Frame-Options).
//
// Required environment variable:
//   EVENTBRITE_PRIVATE_TOKEN     - private token from Eventbrite
//                                  (Account Settings > Developer > API keys)
//                                  (EVENTBRITE_API_TOKEN also accepted)
// Optional:
//   EVENTBRITE_ORGANIZER_ID      - only return events by this organizer
//                                  (each Eventbrite event carries an organizer_id)
//   EVENTBRITE_ORGANIZATION_ID   - org whose events to list. If omitted, the
//                                  first organization on the token is used.
//   EVENTBRITE_EVENT_IDS         - comma-separated event ids to return instead
//                                  of listing the organization's live events.

const API_BASE = 'https://www.eventbriteapi.com/v3';

exports.handler = async (event) => {
  const token = process.env.EVENTBRITE_PRIVATE_TOKEN || process.env.EVENTBRITE_API_TOKEN;
  if (!token) {
    return json(500, { error: 'Missing EVENTBRITE_PRIVATE_TOKEN' });
  }

  // Add ?debug=1 to inspect what the Eventbrite API returned (no secrets leaked).
  const debug = !!(event.queryStringParameters && event.queryStringParameters.debug);

  try {
    let rawEvents;
    let debugInfo = {};
    const explicitIds = (process.env.EVENTBRITE_EVENT_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (explicitIds.length) {
      rawEvents = await Promise.all(explicitIds.map((id) => fetchEvent(id, token)));
      rawEvents = rawEvents.filter(Boolean);
      debugInfo = { mode: 'event_ids', requestedIds: explicitIds, returnedCount: rawEvents.length };
    } else {
      const orgId = process.env.EVENTBRITE_ORGANIZATION_ID || (await fetchFirstOrgId(token));
      if (!orgId) return json(500, { error: 'Could not resolve an Eventbrite organization id' });
      const orgEvents = await fetchOrgEvents(orgId, token);

      // Optionally narrow to a single organizer (events carry organizer_id).
      const organizerId = (process.env.EVENTBRITE_ORGANIZER_ID || '').trim();
      rawEvents = organizerId
        ? orgEvents.filter((ev) => String(ev.organizer_id) === organizerId)
        : orgEvents;

      debugInfo = {
        mode: 'organization',
        organizationId: orgId,
        organizerIdFilter: organizerId || null,
        eventsFromOrg: orgEvents.length,
        eventsAfterOrganizerFilter: rawEvents.length,
        organizerIdsSeen: [...new Set(orgEvents.map((e) => e.organizer_id))],
        statusesSeen: [...new Set(orgEvents.map((e) => e.status))],
        namesSeen: orgEvents.map((e) => e.name && e.name.text),
      };
    }

    const events = rawEvents.map(normalizeEvent).filter(Boolean);

    if (debug) {
      return json(200, { debug: debugInfo, events });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache at the edge/browser so we don't hit Eventbrite on every visit.
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ events }),
    };
  } catch (err) {
    console.error('Eventbrite fetch error:', err.message);
    return json(502, { error: 'Failed to fetch events' });
  }
};

async function fetchFirstOrgId(token) {
  const res = await ebFetch(`${API_BASE}/users/me/organizations/`, token);
  if (!res.ok) throw new Error(`organizations lookup failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const orgs = data.organizations || [];
  return orgs.length ? orgs[0].id : null;
}

async function fetchOrgEvents(orgId, token) {
  const url =
    `${API_BASE}/organizations/${orgId}/events/` +
    `?status=live&order_by=start_asc&time_filter=current_future&expand=venue,ticket_availability`;
  const res = await ebFetch(url, token);
  if (!res.ok) throw new Error(`org events failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.events || [];
}

async function fetchEvent(id, token) {
  const res = await ebFetch(`${API_BASE}/events/${id}/?expand=venue,ticket_availability`, token);
  if (!res.ok) {
    console.warn(`Could not fetch event ${id}: ${res.status}`);
    return null;
  }
  return res.json();
}

function ebFetch(url, token) {
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
}

// Trim the verbose Eventbrite payload down to what the page needs, and
// pre-format dates in the event's own timezone.
function normalizeEvent(ev) {
  if (!ev || !ev.id) return null;
  const tz = (ev.start && ev.start.timezone) || 'America/Denver';
  const startUtc = ev.start && ev.start.utc;
  const endUtc = ev.end && ev.end.utc;

  const venue = ev.venue
    ? [ev.venue.name, ev.venue.address && ev.venue.address.city].filter(Boolean).join(', ') || null
    : null;

  let summary = (ev.summary || (ev.description && ev.description.text) || '').trim();
  if (summary.length > 220) summary = summary.slice(0, 217).trimEnd() + '…';

  const soldOut = !!(ev.ticket_availability && ev.ticket_availability.is_sold_out);

  return {
    id: ev.id,
    name: (ev.name && ev.name.text) || 'Upcoming Event',
    url: ev.url || null,
    date: startUtc ? formatDate(startUtc, tz) : null,
    time: startUtc ? formatTimeRange(startUtc, endUtc, tz) : null,
    venue,
    summary,
    image: (ev.logo && ev.logo.url) || null,
    soldOut,
  };
}

function formatDate(utc, timeZone) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(utc));
  } catch (e) {
    return null;
  }
}

function formatTimeRange(startUtc, endUtc, timeZone) {
  try {
    const opts = { timeZone, hour: 'numeric', minute: '2-digit' };
    const start = new Intl.DateTimeFormat('en-US', opts).format(new Date(startUtc));
    if (!endUtc) return start;
    const end = new Intl.DateTimeFormat('en-US', { ...opts, timeZoneName: 'short' }).format(new Date(endUtc));
    return `${start} – ${end}`;
  } catch (e) {
    return null;
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  };
}
