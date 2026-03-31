// split_algo.js
// Minimum Cash Flow Algorithm
// graph[i][j] = amount person i owes person j

var N = 0;
var nameArray = [];
var settlements = [];

function getMin(arr) {
    var minInd = 0;
    for (var i = 1; i < N; i++) {
        if (arr[i] < arr[minInd]) minInd = i;
    }
    return minInd;
}

function getMax(arr) {
    var maxInd = 0;
    for (var i = 1; i < N; i++) {
        if (arr[i] > arr[maxInd]) maxInd = i;
    }
    return maxInd;
}

function minOf2(x, y) {
    return (x < y) ? x : y;
}

function minCashFlowRec(amount) {
    var mxCredit = getMax(amount);
    var mxDebit  = getMin(amount);

    // All settled when both max credit and max debit are near zero
    if (Math.abs(amount[mxCredit]) < 0.01 && Math.abs(amount[mxDebit]) < 0.01) {
        return;
    }

    var min = minOf2(-amount[mxDebit], amount[mxCredit]);
    amount[mxCredit] -= min;
    amount[mxDebit]  += min;

    settlements.push({
        from:   nameArray[mxDebit],
        to:     nameArray[mxCredit],
        amount: Math.round(min * 100) / 100
    });

    minCashFlowRec(amount);
}

// Main entry point.
// Returns an array of { from, to, amount } objects.
function calculate(graph, names) {
    N = graph.length;
    nameArray = names;
    settlements = [];

    // Build net amount array: positive = to receive, negative = to pay
    var amount = [];
    for (var p = 0; p < N; p++) {
        amount[p] = 0;
    }

    for (var p = 0; p < N; p++) {
        for (var i = 0; i < N; i++) {
            amount[p] += (graph[i][p] - graph[p][i]);
        }
    }

    minCashFlowRec(amount);
    return settlements;
}