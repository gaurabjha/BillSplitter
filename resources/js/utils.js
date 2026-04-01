// utils.js
// Utility and helper functions

var avatarColors = ['av-0', 'av-1', 'av-2', 'av-3', 'av-4'];

function avatarClass(name) {
    var idx = 0;
    for (var i = 0; i < name.length; i++) { idx += name.charCodeAt(i); }
    return avatarColors[idx % avatarColors.length];
}

function initials(name) {
    var parts = name.trim().split(' ');
    var result = '';
    for (var i = 0; i < Math.min(parts.length, 2); i++) {
        if (parts[i].length > 0) result += parts[i][0].toUpperCase();
    }
    return result;
}

function formatRs(n) {
    var num = parseFloat(n) || 0;
    return '\u20B9' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(ts) {
    var d = new Date(ts);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); showToast('Copied to clipboard!', 'accent'); } catch(e) { alert(text); }
    document.body.removeChild(ta);
}

function showToast(msg, type) {
    $('#autosaveToast').remove();
    var bg = type === 'accent' ? 'var(--accent)' : 'var(--green)';
    var icon = type === 'accent' ? 'fa-clipboard-check' : 'fa-check-circle';
    $('body').append(
        '<div id="autosaveToast" style="background:' + bg + '">' +
        '<i class="fas ' + icon + '"></i> ' + msg + '</div>'
    );
    setTimeout(function () { $('#autosaveToast').addClass('fade-out'); }, 1800);
    setTimeout(function () { $('#autosaveToast').remove(); }, 2300);
}
