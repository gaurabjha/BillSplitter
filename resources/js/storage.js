// storage.js
// Persistence and storage management for bills

function storageGet(key) {
    try { return localStorage.getItem(key); } catch(e) { return null; }
}

function storageSet(key, val) {
    try { localStorage.setItem(key, val); } catch(e) {}
}

function loadAllBills() {
    var raw = storageGet('billsplitter_bills');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch(e) { return []; }
}

function saveAllBills(bills) {
    storageSet('billsplitter_bills', JSON.stringify(bills));
}

// Bill ID is derived from the bill name (slug) so same-named bills always overwrite
function makeBillId(name) {
    return 'bill__' + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}
