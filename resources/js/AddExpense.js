// Bill Splitter - Main JavaScript
$(document).ready(function () {
	// Initialize tooltips
	$('[data-toggle="tooltip"]').tooltip();
	$("#ExpenditureBody, #ExpenseReportCardBody, #ExpenseReportCard").hide();

	// Hide tooltips on click
	$('body').on('click', '*', function () { $(this).tooltip('hide') });

	// Initialize Select2 for members input
	$('#members').select2({
		placeholder: "Enter Members for the Bill",
		tags: true,
		allowClear: true,
		minimumResultsForSearch: -1,
	});

	var participants = [];
	var participantsOptionsSelected = '';
	var participantsOptions = '';

	// Create the expense table action column HTML
	var actions = '<td id="action" class="text-center">' +
		'<a class="delete justify-content-center" title="Delete" data-toggle="tooltip">' +
		'<i class="fas fa-trash-alt"></i>' +
		'</a>' +
		'</td>';

	// Add new expense row to table
	function newColumn() {
		var index = $("#expenseTable tbody tr:last-child").index();
		var row = '<tr>' +
			'<td><select class="form-select payee-select" id="payee">' + participantsOptions + '</select></td>' +
			'<td><input type="text" class="form-control expense-summary" id="summary" placeholder="e.g., Dinner, Groceries" /></td>' +
			'<td><input type="number" class="form-control expense-amount" id="amount" placeholder="0.00" step="0.01" min="0" /></td>' +
			'<td>' +
			'<select id="js-example-basic-hide-search-multi" class="paidFor form-select" multiple style="width: 100%">' + participantsOptionsSelected + '</select>' +
			'</td>' +
			actions +
			'</tr>';
		$("#expenseTable").append(row);
		$('[data-toggle="tooltip"]').tooltip();
		$('#expenseTable tbody tr:last-child #js-example-basic-hide-search-multi').select2();
		$('#expenseTable tbody tr:last-child #js-example-basic-hide-search-multi').on('select2:opening select2:closing', function (event) {
			var $searchfield = $(this).parent().find('.select2-search__field');
			$searchfield.prop('disabled', true);
		});
	}

	// Add new expense row on button click
	$(".add-new").click(function () {
		newColumn();
	});

	// Delete expense row on delete button click
	$(document).on("click", ".delete", function () {
		$(this).parents("tr").fadeOut(300, function () {
			$(this).remove();
		});
	});

	// Handle "Continue to Add Expenses" button click
	$("#AddExpenseButton").click(function () {
		// Validate bill name
		var billName = $('#meta-bill-name').val().trim();
		if (!billName) {
			showAlert('Please enter a bill name', 'danger');
			return;
		}

		// Get selected participants
		participants = $("#members :selected").map((_, e) => e.value).get();

		if (participants.length === 0) {
			showAlert('Please add at least one member', 'danger');
			return;
		}

		// Update UI with bill details
		$('#BillName').html(billName + ' <span style="font-weight: 300;">Expense</span>');
		$('#participants').html('<i class="fas fa-users me-1"></i>Members: ' + participants.join(', '));

		// Generate options for participants
		participants.forEach(element => {
			participantsOptionsSelected += '<option selected value="' + element + '">' + element + '</option>';
			participantsOptions += '<option value="' + element + '">' + element + '</option>';
		});

		// Hide bill meta card and show expense section
		$("#BillMetaCard").slideUp(500);
		$("#ExpenditureBody, #ExpenseReportCard").slideDown(500);
		$('#AddExpenseButton').remove();

		// Add first expense row
		newColumn();
		showAlert('Bill created! Start adding expenses.', 'success');
	});

	// Handle "View Expense Report" button click
	$("#ExpenseReportButton").click(function () {
		// Clear previous report
		$("#ExpenseReportCardBody").html("");

		// Validate that expenses have been added
		var rows = $('#expenseTable > tbody > tr').length;
		if (rows === 0) {
			showAlert('Please add at least one expense', 'warning');
			return;
		}

		// Show report section
		$("#ExpenseReportCardBody").slideDown(500, function () {
			// Create adjacency matrix for bill splitting
			var graph = Array(participants.length).fill().map(() => Array(participants.length).fill(0));

			// Process each expense row
			$('#expenseTable > tbody > tr').each(function (index, tr) {
				var payee = $(tr).find('#payee').val();
				var amount = $(tr).find('#amount').val();
				var summary = $(tr).find('#summary').val();

				// Validate expense entry
				if (!payee || !amount || parseFloat(amount) <= 0) {
					return; // Skip invalid entries
				}

				var paidFor = $(tr).find('.paidFor :selected').map((_, e) => e.value).get();

				if (paidFor.length === 0) {
					return; // Skip if no one is selected
				}

				// Add each person's share to the graph
				paidFor.forEach(element => {
					graph[participants.indexOf(element)][participants.indexOf(payee)] += (parseFloat(amount) / paidFor.length);
				});
			});

			// Calculate and display settlements
			calculate(graph, participants);

			// Add reset button
			if (!$('#ResetButton').length) {
				$("#ExpenseReportCardBody").append(
					'<div class="mt-4">' +
					'<button class="btn btn-warning w-100" id="ResetButton">' +
					'<i class="fas fa-redo me-2"></i>Start Over' +
					'</button>' +
					'</div>'
				);

				$('#ResetButton').click(function () {
					resetApp();
				});
			}
		});
	});

	// Show alert message
	function showAlert(message, type) {
		var alertClass = 'alert-' + type;
		var icon = type === 'success' ? '<i class="fas fa-check-circle me-2"></i>' :
			type === 'danger' ? '<i class="fas fa-exclamation-circle me-2"></i>' :
			'<i class="fas fa-info-circle me-2"></i>';

		var alertHtml = '<div class="alert ' + alertClass + ' alert-dismissible fade show" role="alert">' +
			icon + message +
			'<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
			'</div>';

		$('.container').prepend(alertHtml);

		// Auto dismiss after 5 seconds
		setTimeout(function () {
			$('.alert').fadeOut(300, function () { $(this).remove(); });
		}, 5000);
	}

	// Reset the application
	function resetApp() {
		// Clear all state
		participants = [];
		participantsOptionsSelected = '';
		participantsOptions = '';

		// Reset UI
		$("#BillMetaCard").show();
		$("#ExpenditureBody, #ExpenseReportCard").hide();
		$("#ExpenditureBody, #ExpenseReportCardBody").html('');
		$('#meta-bill-name').val('');
		$('#members').val(null).trigger('change');
		$("#expenseTable tbody").html('');

		// Recreate Add Expense button
		var addButton = '<button class="btn btn-primary w-100" id="AddExpenseButton">' +
			'<i class="fas fa-arrow-right me-2"></i>Continue to Add Expenses' +
			'</button>';
		$('#BillMetaCard .card-body').append(addButton);

		$("#AddExpenseButton").click(function () {
			// This will be handled by the existing click handler
			$("#AddExpenseButton").trigger('click');
		});

		showAlert('Ready to start a new bill!', 'success');
	}
});