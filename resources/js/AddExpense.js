// import SplitBill from './split_algo.js'; 

$(document).ready(function () {
	$('[data-toggle="tooltip"]').tooltip();
	$("#ExpenditureBody, #ExpenseReportCardBody, #ExpenseReportCard").hide();

	$('body').on('click', '*', function () { $(this).tooltip('hide') });

	$('#members').select2({
		placeholder: "Enter Members for the Bill",
		tags: true,
		allowClear: true,
		minimumResultsForSearch: -1,
	});
	// $('#members').on('select2:open', function () {
	// 	alert("opened")
	// 	// get values of selected option
	// 	var values = $(this).val();
	// 	// get the pop up selection
	// 	var pop_up_selection = $('.select2-results__options');
	
	// 	if (values != null ) {
	// 	  // hide the selected values
	// 	   pop_up_selection.find("li[aria-selected=true]").hide();
	
	// 	} else {
	// 	  // show all the selection values
	// 	  pop_up_selection.find("li[aria-selected=true]").show();
	// 	}
	
	//   });

	var participants = []; //$("#participants").html().split(',');

	participantsOptionsSelected = ''
	participantsOptions = ''

	//alert(participants)
	// create the expense table action column
	var actions = '<td id="action" class="w-10">                          		' +
		'				<a class="delete justify-content-center" title="Delete" data-toggle="tooltip">	' +
		'					<i class="fas fa-trash-alt"></i>				' +
		'				</a>													' +
		'			</td>                                                 		';

	// Append table with add row form on add new button click


	function newColumn() {
		var index = $("#expenseTable tbody tr:last-child").index();
		var row = '<tr>' +
			'<td><select class="form-select" id="payee">' + participantsOptions + '</select></td>' +
			'<td><input type="text" class="form-control" id="summary" /></td>' +
			'<td><input type="number" class="form-control" id="amount" /></td>' +
			'<td> ' +
			'   <div> ' +
			'		<select id="js-example-basic-hide-search-multi" class="paidFor" multiple style="width: 100%">' + participantsOptionsSelected + '</select>' +
			'	</div>' +
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

	// newColumn();

	$(".add-new").click(function () {
		newColumn();
	});

	$(document).on("click", ".delete", function () {
		$(this).parents("tr").remove();
	});;

	$("#AddExpenseButton").click(function () {

		//Create the Participants Options
		participants = $("#members :selected").map((_, e) => e.value).get();

		//$("input[id='person']")
		//	.map(function () { return $(this).val(); }).get();

		$('#BillName').html($('#meta-bill-name').val() + '<b> Expense</b>')
		$('#participants').html('for ' + participants.join())

		participants.forEach(element => {
			participantsOptionsSelected += '<option selected value="' + element + '">' + element + '</option>'
			participantsOptions += '<option value="' + element + '">' + element + '</option>'
		});

		//remove the Bill Meta data section and show the Add Expense Section
		$("#BillMetaCard").slideUp(1000);
		$("#ExpenditureBody, #ExpenseReportCard").slideDown(1000);
		$('#AddExpenseButton').remove()
		newColumn()
	});



	$("#ExpenseReportButton").click(function () {

		//Create the Participants Options
		$("#ExpenseReportCardBody").html("")
		$("#ExpenseReportCardBody").slideDown(1000, function () {


			var graph = Array(participants.length).fill().map(() => Array(participants.length).fill(0));

			$('#expenseTable > tbody  > tr').each(function (index, tr) {
				// console.log(index);
				// console.log($(tr).find('#payee').val());

				var payee = $(tr).find('#payee').val();

				var amount = $(tr).find('#amount').val();

				var paidFor = $(".paidFor :selected").map((_, e) => e.value).get();

				paidFor.forEach(element => {
					console.log(element + " owes Rs " + (parseFloat(amount) / paidFor.length) + " to " + payee);
					graph[participants.indexOf(element)][participants.indexOf(payee)] += (parseFloat(amount) / paidFor.length);
				});
			});

			// Print the solution
			// alert("Bill Object created");
			// alert(graph)
			var share = new Map()

			participants.forEach(receiver => {
				var myShare = 0.0;
				participants.forEach(payer => {
					myShare += graph[participants.indexOf(receiver)][participants.indexOf(payer)];
				});
				share.set(receiver, myShare);
			});
			share.forEach(function (value, key) {
				console.log(key + ' Expenditure is Rs : ' + value);
			})
			calculate(graph, participants)
		});
	});
});