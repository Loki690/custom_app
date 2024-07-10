# Copyright (c) 2024, joncsr and Contributors
# See license.txt
# import frappe
from custom_app.customapp.doctype.pos_invoice_custom.pos_invoice_custom import get_sales_invoice_payment_amount
from frappe.tests.utils import FrappeTestCase


class TestPOSInvoiceCustom(FrappeTestCase):
	pass
    # Fetch payment records for a valid parent Sales Invoice
def test_fetch_payment_records_for_valid_parent(self, mocker):
        # Mock frappe.get_all to return a sample response
    mock_get_all = mocker.patch('frappe.get_all', return_value=[
            {'name': 'PAY-001', 'parent': 'SINV-001', 'mode_of_payment': 'Cash', 'amount': 100.0},
            {'name': 'PAY-002', 'parent': 'SINV-001', 'mode_of_payment': 'Credit Card', 'amount': 200.0}
        ])
    
        # Initialize the parent variable
    parent = "SINV-001"
    
        # Invoke the get_sales_invoice_payment_amount function
    result = get_sales_invoice_payment_amount(parent)
    
        # Assert the result
    assert result == [
            {'name': 'PAY-001', 'parent': 'SINV-001', 'mode_of_payment': 'Cash', 'amount': 100.0},
            {'name': 'PAY-002', 'parent': 'SINV-001', 'mode_of_payment': 'Credit Card', 'amount': 200.0}
        ]
    
        # Ensure frappe.get_all was called with the correct parameters
    mock_get_all.assert_called_once_with(
            'Sales Invoice Payment',
            filters={'parent': parent},
            fields=['name', 'parent', 'mode_of_payment', 'amount']
        )
