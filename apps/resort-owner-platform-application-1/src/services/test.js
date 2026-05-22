const fs = require('fs');

const CONFIG = {
    apiBase: 'https://api.massmarketai.com/api/v1/opportunities/search/by',
    locationId: 'Dhw7oQO3lltXgYzgnpyc',
    pipelineId: 'VWrYLBxy8kUosWreKsrs',
    bearer: 'f-j-FmBrebO7DEwpqX-vF4JDPp1uR88lkIhWEUbS9ao',
    output: 'C:/Users/User/Downloads/opportunities.json',
};

async function fetchPage(startAfter, startAfterId) {
    const params = {
        'location-id': CONFIG.locationId,
        'pipeline-id': CONFIG.pipelineId,
        'version': '2021-04-15',
        'request-id': String(Date.now()),
        'status': 'all',
    };

    if (startAfter) params['startAfter'] = startAfter;
    if (startAfterId) params['startAfterId'] = startAfterId;

    const url = `${CONFIG.apiBase}?${new URLSearchParams(params)}`;

    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${CONFIG.bearer}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} → ${await res.text()}`);
    return res.json();
}

async function fetchAll() {
    const seen = new Set();
    const all = [];
    let startAfter = null;
    let startAfterId = null;
    let page = 1;

    while (true) {
        console.log(`Fetching page ${page}...`);
        const data = await fetchPage(startAfter, startAfterId);

        const opportunities = data.opportunities ?? data.data ?? [];
        if (opportunities.length === 0) break;

        let newCount = 0;
        for (const opp of opportunities) {
            if (!seen.has(opp.opportunity_id)) {
                seen.add(opp.opportunity_id);
                all.push(opp);
                newCount++;
            }
        }

        console.log(`  Got ${opportunities.length} records, ${newCount} new (total unique: ${all.length})`);

        // Stop if we got no new records (cursor not advancing)
        if (newCount === 0) break;

        const meta = data.meta ?? {};
        const nextStartAfter = meta.startAfter ?? meta.next_page ?? null;
        const nextStartAfterId = meta.startAfterId ?? null;

        // Stop if cursor hasn't changed
        if (nextStartAfter === startAfter && nextStartAfterId === startAfterId) break;
        // Stop if API signals no more pages
        if (!nextStartAfter && !nextStartAfterId) break;

        startAfter = nextStartAfter;
        startAfterId = nextStartAfterId;
        page++;

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
    }

    return all;
}

fetchAll()
    .then(all => {
        fs.writeFileSync(CONFIG.output, JSON.stringify(all, null, 2));
        console.log(`\nSaved ${all.length} unique opportunities to ${CONFIG.output}`);
    })
    .catch(err => console.error('Error:', err.message));
