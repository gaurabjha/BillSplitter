// Bill Splitter - Main JavaScript
$(document).ready(function () {
	// Initialize tooltips
	$('[data-toggle="tooltip"]').tooltip();

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
	var expenseCardCreated = false;

	// Create the expense card dynamically
	function createExpenseCard() {
		if (expenseCardCreated) return;
		
		var expenseCardHTML = `
			<!-- Add Expense Card -->
			<div class="card" id="ExpenseCard">
				<div class="card-header">
					<div class="row align-items-center">
						<div class="col-md-8 col-12">
							<h2 class="mb-2"><i class="fas fa-plus-circle me-2"></i><span id="BillName"></span></h2>
							<p class="mb-0 text-white-50"><span id="participants"></span></p>
						</div>
					</div>
				</div>
				<div class="card-body" id="ExpenditureBody">
					<div id="expendeEditor">
						<div class="table-responsive">
							<div class="table-wrapper">
								<form action="" id="commentForm">
									<fieldset>
										<table id="expenseTable" class="table table-hover">
											<thead>
												<tr>
													<th><i class="fas fa-user-circle me-1"></i>Paid By</th>
													<th><i class="fas fa-comment me-1"></i>Description</th>
													<th><i class="fas fa-rupee-sign me-1"></i>Amount</th>
													<th><i class="fas fa-share-alt me-1"></i>Shared By</th>
													<th><i class="fas fa-trash me-1"></i>Action</th>
												</tr>
											</thead>
											<tbody>
											</tbody>
										</table>
									</fieldset>
								</form>
							</div>
						</div>
						<button type="button" class="btn btn-info w-100 add-new">
							<i class="fas fa-plus me-2"></i>Add New Expense
						</button>
					</div>
				</div>
			</div>

			<!-- Expense Report Card -->
			<div class="card" id="ExpenseReportCard">
				<div class="card-header">
					<button class="btn btn-light w-100 text-start" id="ExpenseReportButton">
						<i class="fas fa-chart-bar me-2"></i>View Expense Report
					</button>
				</div>
				<div class="card-body" id="ExpenseReportCardBody">
				</div>
			</div>
		`;
		
		$('#card_container').after(expenseCardHTML);
		expenseCardCreated = true;
		initializeExpenseHandlers();
		$('[data-toggle="tooltip"]').tooltip();
	}

	// Initialize expense-related event handlers
	function initializeExpenseHandlers() {
		$(".add-new").off('click').on('click', function () {
			newColumn();
		});

		$(document).off("click", ".delete").on("click", ".delete", function () {
			$(this).parents("tr").fadeOut(300, function () {
				$(this).remove();
			});
		});

		$("#ExpenseReportButton").off('click').on('click', function () {
			$("#ExpenseReportCardBody").html("");
			var rows = $('#expenseTable > tbody > tr').length;
			if (rows === 0) {
				showAlert('Please add at least one expense', 'warning');
				return;
			}

			$("#ExpenseReportCardBody").slideDown(500, function () {
				var graph = Array(participants.length).fill().map(() => Array(participants.length).fill(0));

				$('#expenseTable > tbody > tr').each(function (index, tr) {
					var payee = $(tr).find('#payee').val();
					var amount = $(tr).find('#amount').val();

					if (!payee || !amount || parseFloat(amount) <= 0) {
						return;
					}

					var paidFor = $(tr).find('.paidFor :selected').map((_, e) => e.value).get();

					if (paidFor.length === 0) {
						return;
					}

					paidFor.forEach(element => {
						graph[participants.indexOf(element)][participants.indexOf(payee)] += (parseFloat(amount) / paidFor.length);
					});
				});

				calculate(graph, participants);

				if (!$('#ResetButton').length) {
					$("#ExpenseReportCardBody").append(
						'<div class="mt-4"><button class="btn btn-warning w-100" id="ResetButton"><i class="fas fa-redo me-2"></i>Start Over</button></div>'
					);
					$('#ResetButton').off('click').on('click', function () {
						resetApp();
					});
				}
			});
		});
	}

	var actions = '<td id="action" class="text-center"><a class="delete justify-content-center" title="Delete" data-toggle="tooltip"><i class="fas fa-trash-alt"></i></a></td>';

	function newColumn() {
		var index = $("#expenseTable tbody tr:last-child").index();
		var row = '<tr>' +
			'<td><select class="form-select payee-select" id="payee">' + participantsOptions + '</select></td>' +
			'<td><input type="text" class="form-control expense-summary" id="summary" placeholder="e.g., Dinner, Groceries" /></td>' +
			'<td><input type="number" class="form-control expense-amount" id="amount" placeholder="0.00" step="0.01" min="0" /></td>' +
			'<td><select id="js-example-basic-hide-search-multi" class="paidFor form-select" multiple style="width: 100%">' + participantsOptionsSelected + '</select></td>' +
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

	$("#AddExpenseButton").click(function () {
		var billName = $('#meta-bill-name').val().trim();
		if (!billName) {
			showAlert('Please enter a bill name', 'danger');
			return;
		}

		participants = $("#members :selected").map((_, e) => e.value).get();

		if (participants.length === 0) {
			showAlert('Please add at least one member', 'danger');
			return;
		}

		createExpenseCard();

		$('#BillName').html(billName + ' <span style="font-weight: 300;">Expense</span>');
		$('#participants').html('<i class="fas fa-users me-1"></i>Members: ' + participants.join(', '));

		participants.forEach(element => {
			participantsOptionsSelected += '<option selected value="' + element + '">' + element + '</option>';
			participantsOptions += '<option value="' + element + '">' + element + '</option>';
		});

		$("#BillMetaCard").slideUp(500);
		$("#ExpenditureBody").slideDown(500);
		$("#AddExpenseButton").remove();

		newColumn();
		showAlert('Bill created! Start adding expenses.', 'success');
	});

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

		setTimeout(function () {
			$('.alert').fadeOut(300, function () { $(this).remove(); });
		}, 5000);
	}

	function resetApp() {
		participants = [];
		participantsOptionsSelected = '';
		participantsOptions = '';
		expenseCardCreated = false;

		$("#BillMetaCard").show();
		$("#ExpenseCard, #ExpenseReportCard").remove();
		$('#meta-bill-name').val('');
		$('#members').val(null).trigger('change');

		if (!$('#AddExpenseButton').length) {
			var btn = '<button type="button" class="btn btn-primary w-100" id="AddExpenseButton"><i class="fas fa-arrow-right me-2"></i>Continue to Add Expenses</button>';
			$('#BillMetaCard .card-body').append(btn);
			
			$("#AddExpenseButton").off('click').on('click', function () {
				$("#AddExpenseButton").trigger('click');
			});
		}

		showAlert('Ready to start a new bill!', 'success');
	}
});
