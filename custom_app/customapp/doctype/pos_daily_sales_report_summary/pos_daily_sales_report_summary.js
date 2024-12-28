frappe.ui.form.on('POS Daily Sales Report Summary', {

    pos_profile: function (frm) {
        get_data(frm);
    },

    date_from: function (frm) {

        console.log(frm.doc.date_from);
        get_data(frm);
    },

    date_to: function (frm) {
        console.log(frm.doc.date_to);
        get_data(frm);
    },

});


function load_functions(frm) {
    if (frm.is_new) {

    }
}


function get_data(frm) {
    if (frm.doc.pos_profile && frm.doc.date_from && frm.doc.date_to) {
        const today = frappe.datetime.now_date(); // Use frappe.datetime to get today's date
    
        let progress_value = 0; // Initial progress value
        let interval = setInterval(() => {
            if (progress_value < 99) { // Increment only up to 90%
                progress_value += 1;
    
                frappe.show_progress(
                    __('Fetching data'),
                    progress_value,
                    100,
                    `${progress_value}% completed`
                );
            }
        }, 200);
    
        frappe.call({
            method: 'custom_app.customapp.doctype.pos_daily_sales_report_summary.pos_daily_sales_report_summary.get_pos_invoices',
            args: {
                pos_profile: frm.doc.pos_profile,
                from_date: frm.doc.date_from || today,
                to_date: frm.doc.date_to || today
            },
            callback: function (response) {
                clearInterval(interval); // Stop progress increment
                frappe.show_progress(
                    __('Fetching data'),
                    100,
                    100,
                    __('Completed')
                ); // Set final progress to 100%
                frappe.hide_progress(); // Hide progress bar after a short delay
                console.log(response.message);
    
                const { totals, payments, clerk_transactions } = response.message;
    
                frm.set_value('sales_net_total', response.message.net_total); 
                frm.set_value('sales_grand_total', response.message.grand_total); 
                frm.set_value('confirmed_transaction_total', response.message.total_transaction); 
                frm.set_value('confirmed_transaction_item_total', response.message.total_items); 
    
                const default_sales_type = [
                    { sales_type: "Non VAT", amount: totals.total_zero_rated_sales },
                    { sales_type: "Tax Exempt", amount: totals.total_vat_exempt_sales },
                    { sales_type: "Vat Sales", amount: totals.total_vatable_sales },
                    { sales_type: "Government", amount: 0 }, // No values at this time
                    { sales_type: "Vat Amount", amount: totals.total_taxes_and_charges },
                ];
    
                frm.clear_table('sales_details');
    
                default_sales_type.forEach(sales_type => {
                    let child = frm.add_child('sales_details');
                    frappe.model.set_value(child.doctype, child.name, 'sales_type', sales_type.sales_type);
                    frappe.model.set_value(child.doctype, child.name, 'amount', sales_type.amount);
                });

                frm.clear_table('payment_details');
    
                payments.forEach(payment => {
                    let child = frm.add_child('payment_details');
                    frappe.model.set_value(child.doctype, child.name, 'payment_type', payment.mode_of_payment);
                    frappe.model.set_value(child.doctype, child.name, 'amount', payment.total_amount);
                });

                frm.clear_table('clerk_sales');

                clerk_transactions.forEach(clerk => {
                    let child = frm.add_child('clerk_sales');
                    frappe.model.set_value(child.doctype, child.name, 'clerk_name', clerk.clerk_name);
                    frappe.model.set_value(child.doctype, child.name, 'amount', clerk.grand_total);
                    frappe.model.set_value(child.doctype, child.name, 'no_of_trasaction', clerk.transaction_count);
                })
    
                frm.refresh_field('sales_details');
                frm.refresh_field('payment_details');
                frm.refresh_field('sales_net_total');
                frm.refresh_field('sales_grand_total');
                frm.refresh_field('clerk_sales');
                
                frm.refresh_field('confirmed_transaction_total');
                frm.refresh_field('confirmed_transaction_item_total');
     
            }
        });
    }
}

