
$(document).ready(function () {
	$('[data-toggle="tooltip"]').tooltip();

	$('body').on('click', '*', function () { $(this).tooltip('hide') });

	var participants = '' //$("#participants").html().split(',');

	participantsOptionsSelected = ''
	participantsOptions = ''

	//alert(participants)
	// create the expense table action column
	var actions = '<td id="action" class="w-10">                          		' +
		'				<a class="delete" title="Delete" data-toggle="tooltip">	' +
		'					<i class="material-icons">&#xE872;</i>				' +
		'				</a>													' +
		'			</td>                                                 		';


	// Append table with add row form on add new button click

	function newColumn() {
		var index = $("#expenseTable tbody tr:last-child").index();
		var row = '<tr>' +
			'<td><input class="form-control" list="payee" name="paidBy" id="paidBy" required>' +
			'	<datalist id="payee"> ' + participantsOptions + '</datalist>' +
			'<td><input type="text" class="form-control" name="summary" required/></td>' +
			'<td><input type="number" class="form-control" name="amount" required/></td>' +
			'<td> ' +
			'   <div><select id="choices-multiple-remove-button" multiple name="paidFor">' +
			participantsOptionsSelected +
			'	</select></div>' +
			'</td>' +
			actions +
			'</tr>';
		$("#expenseTable").append(row);
		$('[data-toggle="tooltip"]').tooltip();
		var multipleCancelButton = new Choices('#expenseTable tbody tr:last-child #choices-multiple-remove-button', {
			removeItemButton: true
		});
	}

	// newColumn();

	$(".add-new").click(function () {
		newColumn();
	});

	$(document).on("click", ".delete", function () {
		$(this).parents("tr").remove();
	});

	$("#AddExpenseAccordianButton").click(function () {
		$('#BillMetaCard button').attr("disabled", true);
		$(this).attr("disabled", true);

		participants = $("input[id='person']")
			.map(function () { return $(this).val(); }).get();

		$('#BillName').html($('#meta-bill-name').val())
		$('#participants').html(participants.join())

		participants.forEach(element => {
			participantsOptionsSelected += '<option selected value="' + element + '">' + element + '</option>'
			participantsOptions += '<option value="' + element + '">'
		});

		newColumn()
	});
});