frappe.ui.form.on('POS Daily Sales Report Summary', {

    onload: function(frm) {
       
    },

    pos_profile: function(frm) {
        get_data(frm);
    },

    date_from: function(frm) {

        console.log(frm.doc.date_from);
        get_data(frm);
    },

    date_to: function(frm) {
        console.log(frm.doc.date_to);
        get_data(frm);
    },

});


function load_functions(frm) {
    if(frm.is_new) {
       
    }
}


function get_data(frm) {
    const today = frappe.datetime.now_date();  // Use frappe.datetime to get today's date
    frappe.call({
        method: 'custom_app.customapp.doctype.pos_daily_sales_report_summary.pos_daily_sales_report_summary.get_pos_invoices',
        args: {
            pos_profile: frm.doc.pos_profile,
            from_date: frm.doc.date_from || today,
            to_date: frm.doc.date_to || today
        },
        callback: function(response) {
            console.log(response.message);

            const totals = response.message.totals;

            const default_sales_type = [
                {sales_type: "Non VAT",amount: totals.total_zero_rated_sales},
                {sales_type: "Tax Exempt" ,amount: totals.total_taxes_and_charges},
                {sales_type: "Vat Sales" ,amount: totals.total_vatable_sales},
                {sales_type: "Government" ,amount: 0}, // no values at this time
                {sales_type: "Vat Amount" ,amount: totals.total_taxes_and_charges},
                ];
        
         frm.clear_table('sales_details');
         
        default_sales_type.forEach(sales_type => {
            let child = frm.add_child('sales_details');
            frappe.model.set_value(child.doctype, child.name, 'sales_type', sales_type.sales_type);
            frappe.model.set_value(child.doctype, child.name, 'amount', sales_type.amount);
        });
        frm.refresh_field('sales_details');
        }
    });
}
