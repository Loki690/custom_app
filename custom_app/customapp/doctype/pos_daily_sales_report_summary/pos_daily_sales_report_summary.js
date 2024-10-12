frappe.ui.form.on('POS Daily Sales Report Summary', {
    
    onload: function(frm) {
      if (frm.is_new()) {
        const today = frappe.datetime.get_today();
        const yesterday = frappe.datetime.add_days(today, -1);
        frm.set_value('date_from', `${yesterday} 23:59:59`);
        frm.set_value('date_to', `${today} 23:59:59`);
    }
    },
    
//   range: function(frm) {
//       select_date_range(frm)
//   },

    pos_profile: function(frm){
        load_functions(frm);
        frm.refresh();
    },
    
    date_from: function(frm){
       set_date_from(frm);
    },
    
    date_to: function(frm){
       set_date_to(frm);
    }
    
});

function load_functions(frm) {
    if(frm.is_new) {
        set_sales_details_values(frm);
        get_pending_trasactions(frm)
        set_payment_details(frm);
        get_cashier_sales(frm);
    }
}



function set_date_from(frm){
    load_functions(frm);
    frm.refresh();
    
}

function set_date_to(frm){
    load_functions(frm);
    frm.refresh();
    
}

function set_sales_details(frm, totals) {
    
       const default_sales_type = [
                {sales_type: "Non VAT",amount: totals[0]},
                {sales_type: "Tax Exempt" ,amount: totals[1]},
                {sales_type: "Vat Sales" ,amount: totals[2]},
                {sales_type: "Government" ,amount: 0}, // no values at this time
                {sales_type: "Vat Amount" ,amount: totals[3]},
                ];
        
         frm.clear_table('sales_details');
                
        default_sales_type.forEach(sales_type => {
            let child = frm.add_child('sales_details');
            frappe.model.set_value(child.doctype, child.name, 'sales_type', sales_type.sales_type);
            frappe.model.set_value(child.doctype, child.name, 'amount', sales_type.amount);
        });
        frm.refresh_field('sales_details');
        //console.log(frm.doc.pos_profile);
}



function set_sales_details_values(frm) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'POS Invoice',
            filters: [
                ['pos_profile', '=', frm.doc.pos_profile],
                ['custom_date_time_posted', 'between', [frm.doc.date_from, frm.doc.date_to]],
                ['status', 'in', ['Paid', 'Consolidated', 'Return']]
            ],
            fields: [
                'name',
                'custom_invoice_series',
                'status',
                'custom_vatable_sales',
                'custom_vat_exempt_sales',
                'custom_zero_rated_sales',
                'custom_vat_amount',
                'total_taxes_and_charges',
                'net_total',
                'grand_total',
                'change_amount',
                'custom_pa_name',
                'customer',
                'is_return',
                'return_against',
                'custom_date_time_posted'
            ],
            limit_page_length: 1000000  // Set a high limit to get all invoices
        },
        callback: function (response) {
            let invoices = response.message || [];
            if (invoices.length === 0) {
                set_default_values(frm);
                return;
            }

            let custom_vatable_sales_total = 0;
            let custom_vat_exempt_sales_total = 0;
            let custom_zero_rated_sales_total = 0;
            let custom_vat_amount_total = 0;

            let payment_details = {};
            let processed_invoices = 0;
            
            invoices.forEach(invoice => {
                if (invoice.custom_invoice_series) {
                    const custom_vatable_sales = invoice.custom_vatable_sales || 0;
                    const custom_vat_exempt_sales = invoice.custom_vat_exempt_sales || 0;
                    const custom_zero_rated_sales = invoice.custom_zero_rated_sales || 0;
                    const custom_vat_amount = invoice.total_taxes_and_charges || 0;

                    custom_vatable_sales_total += custom_vatable_sales;
                    custom_vat_exempt_sales_total += custom_vat_exempt_sales;
                    custom_zero_rated_sales_total += custom_zero_rated_sales;
                    custom_vat_amount_total += custom_vat_amount;

                    set_payment_detail_amount(frm, invoice.name, payment_details, () => {
                        processed_invoices++;

                        // Ensure that 'set_payment_details' is only called once all invoices are processed
                        if (processed_invoices === invoices.length) {
                            const overall_totals = calculate_overall_totals(payment_details);
                            
                            // Pass the invoices array correctly to avoid the TypeError
                            set_payment_details(frm, overall_totals, invoices);
                        }
                    });
                }
            });

            const totals = [
                custom_zero_rated_sales_total,
                custom_vat_exempt_sales_total,
                custom_vatable_sales_total,
                custom_vat_amount_total
            ];

            set_sales_details(frm, totals);
            set_sales_details_total(frm, totals);

            load_confirmed_trasaction(frm, invoices);
            set_clerk_sales(frm, invoices);
            set_cancelled_transaction(frm, invoices);
        },
        error: function (error) {
            console.error("Error fetching invoices:", error);
        }
    });
}

function set_default_values(frm) {
    // This function can set default values or handle the case where no invoices are returned
    frm.clear_table('cashier_sales');
    frm.clear_table('sales_details');
    frm.clear_table('payment_details');
    frm.clear_table('confirmed_transaction');
    frm.clear_table('confirmed_transactions');
    frm.clear_table('clerk_sales');
    frm.clear_table('cashier_sales');
    frm.clear_table('cancelled_transactions');

    frm.set_value('confirmed_transaction_total', 0);
    frm.set_value('sales_details_total', 0);
    frm.set_value('change_amount', 0);
    frm.set_value('total', 0);
    frm.set_value('clerk_sales_no_of_transaction_total', 0);
    frm.set_value('clerk_sales_amount_total', 0);
    frm.refresh_fields();
    //frm.refresh();
}

// Other functions like set_payment_detail_amount, calculate_overall_totals, set_payment_details, calculate_change_amount, set_sales_details, set_sales_details_total, load_confirmed_trasaction, set_clerk_sales, set_cancelled_transaction should be defined elsewhere in your code


function set_sales_details_total(frm, totals) {
    
    // console.log("Sales Taxes Total: ", totals)
    
    const sales_details_total = totals.reduce((sum, value) => sum + value, 0);
    
    // console.log("Sales details: ", sales_details_total);
    
    frm.set_value('sales_details_total', sales_details_total.toFixed(2));
    frm.refresh_field('sales_details_total');
}

function set_payment_details(frm, overall_totals, invoices) {
    // Check if invoices is valid and defined before proceeding
    if (!invoices || !Array.isArray(invoices)) {
        console.error("Invoices are undefined or not an array");
        return;
    }

    frm.clear_table('payment_details');
    let total_amount = 0;

    // Use the invoices array to calculate the total change amount
    let total_change_amount = calculate_change_amount(frm, invoices, overall_totals);
   
    // Iterate through the payment modes in overall_totals
    for (let mode in overall_totals) {
        let child = frm.add_child('payment_details');

        let payment_amount = overall_totals[mode].total_amount;

        // Check if the mode is 'Cash' and subtract the change amount
        if (mode === 'Cash') {
            payment_amount -= total_change_amount;
        }

        frappe.model.set_value(child.doctype, child.name, 'payment_type', mode);
        frappe.model.set_value(child.doctype, child.name, 'amount', payment_amount); // Set the updated total amount
        frappe.model.set_value(child.doctype, child.name, 'count', overall_totals[mode].count); // Set the transaction count

        total_amount += payment_amount; // Accumulate the total amount
    }

    // Refresh and set the total payment details
    frm.refresh_field('payment_details');
    frm.set_value('payment_details_total', total_amount);
    frm.refresh_field('payment_details_total');
}



function set_payment_detail_amount(frm, invoice_id, payment_details, callback) {
    frappe.call({
        method: 'custom_app.customapp.doctype.pos_invoice_custom.pos_invoice_custom.get_sales_invoice_payment_amount',
        args: {
            parent: invoice_id,
        },
        callback: function(response) {
            const payment_amounts = response.message;
            payment_amounts.forEach(payment => {
                let mode_of_payment = payment.mode_of_payment;
                let amount = parseFloat(payment.amount) || 0;

                if (!payment_details[mode_of_payment]) {
                    payment_details[mode_of_payment] = { amounts: [], count: 0 };
                }

                if (amount > 0) {
                    payment_details[mode_of_payment].amounts.push(amount);
                    payment_details[mode_of_payment].count += 1;  // Increment count only if amount is greater than zero
                }
            });

            if (callback) callback();
        }
    });
}


function calculate_overall_totals(payment_details) {
    let overall_totals = {};

    for (let mode_of_payment in payment_details) {
        overall_totals[mode_of_payment] = {
            total_amount: payment_details[mode_of_payment].amounts.reduce((sum, amount) => sum + amount, 0),
            count: payment_details[mode_of_payment].count
        };
    }

    return overall_totals;
}

function load_confirmed_trasaction(frm, invoices){
   
//   console.log("Invoices: ", invoices);
   
   let invoice_count = 0;
    frm.clear_table('confirmed_transaction');
    
    const valid_invoices = invoices.filter(invoice => invoice.status !== 'Return');
    
    // Sort the valid invoices by custom_invoice_series in ascending order
    invoices.sort((a, b) => {
        if (a.custom_invoice_series < b.custom_invoice_series) return -1;
        if (a.custom_invoice_series > b.custom_invoice_series) return 1;
        return 0;
    });
    
    invoices.forEach(invoice => {
            let child = frm.add_child('confirmed_transaction');
            frappe.model.set_value(child.doctype, child.name, 'pos_trasaction', invoice.custom_invoice_series);
            frappe.model.set_value(child.doctype, child.name, 'total', invoice.grand_total);
            invoice_count++;
    });
    
    let lastElement = invoices[invoices.length - 1]; 
    frm.refresh_field('confirmed_transaction');
    frm.set_value('confirmed_transaction_total', invoice_count); // set the invoice totals
    frm.refresh_field('confirmed_transaction_total');
    frm.set_value('invoice_from', invoices[0].custom_invoice_series);
    frm.set_value('invoice_to', lastElement.custom_invoice_series);
    set_confirmed_transactions(frm, invoices[0].custom_invoice_series, lastElement.custom_invoice_series)
    //frm.refresh();
    
}

function set_confirmed_transactions(frm, from_transaction, to_transaction) {
    frm.clear_table('confirmed_transactions');
    let child = frm.add_child('confirmed_transactions');
    frappe.model.set_value(child.doctype, child.name, 'from', from_transaction); 
    frappe.model.set_value(child.doctype, child.name, 'to', to_transaction);
    frm.refresh_field('confirmed_transactions');
}

function set_clerk_sales(frm, invoices) {
    let clerkSalesData = {};
   
    let total_transactions = 0;
    let total_amount = 0;
    let total_net_amount = 0;

    invoices.forEach(invoice => {
        if (!clerkSalesData[invoice.custom_pa_name]) {
            clerkSalesData[invoice.custom_pa_name] = {
                clerk_name: invoice.custom_pa_name,
                no_of_trasaction: 0,
                amount: 0
            };
        }
        clerkSalesData[invoice.custom_pa_name].no_of_trasaction++;
        clerkSalesData[invoice.custom_pa_name].amount += invoice.grand_total; // Sum the grand_total

        // Increment total counters
        total_transactions++;
        total_amount += invoice.grand_total;
        total_net_amount += invoice.net_total || 0;
    });

    // Clear the existing child table
    frm.clear_table('clerk_sales');

    // Add the aggregated data to the clerk_sales child table
    for (let clerk in clerkSalesData) {
        let child = frm.add_child('clerk_sales');
        frappe.model.set_value(child.doctype, child.name, 'clerk_name', clerkSalesData[clerk].clerk_name); 
        frappe.model.set_value(child.doctype, child.name, 'no_of_trasaction', clerkSalesData[clerk].no_of_trasaction); 
        frappe.model.set_value(child.doctype, child.name, 'amount', clerkSalesData[clerk].amount); // Set the total amount
    }

    // Refresh the child table field
    frm.refresh_field('clerk_sales');

    // Set the total number of transactions and total amount
    frm.set_value('clerk_sales_no_of_transaction_total', total_transactions); // Count of all transactions
    
    
    frm.set_value('clerk_sales_amount_total', total_amount); // Total of all amounts
   
    
    frm.refresh_field('clerk_sales_no_of_transaction_total');
    frm.refresh_field('clerk_sales_amount_total');
    
    frm.set_value('sales_net_total', total_net_amount);
    frm.refresh_field('sales_net_total');
}

function calculate_change_amount(frm, invoices, overall_totals) {
    let total_change_amount = 0;
    
    invoices.forEach(invoice => {
        total_change_amount += invoice.change_amount;
    });
    
    return total_change_amount
}

function change_amount(frm, invoices){
    let total_change_amount = 0;
    invoices.forEach(invoice => {
        total_change_amount += parseFloat(invoice.change_amount) || 0;
    });
    return total_change_amount;
}


function set_cancelled_transaction(frm, invoices) {

    frm.clear_table('cancelled_transactions');
    const return_invices = invoices.filter(invoice => invoice.status == 'Return' || invoice.is_return == 1);
    return_invices.forEach(invoice => {
        let child = frm.add_child('cancelled_transactions');
        frappe.model.set_value(child.doctype, child.name, 'invoice', invoice.custom_invoice_series); 
        frappe.model.set_value(child.doctype, child.name, 'amount', invoice.grand_total); 
        frappe.model.set_value(child.doctype, child.name, 'customer', invoice.customer);
        frappe.model.set_value(child.doctype, child.name, 'clerk', invoice.custom_pa_name); 
    });
    
    frm.refresh_field('cancelled_transactions');
}

function set_return_aginst_invoice(frm){
    
}

function get_cashier_sales(frm){
    
    const date_now = frappe.datetime.get_today();
    
    frappe.call({
        method: 'frappe.client.get_list',
        args: { 
            doctype: 'Cash Count Denomination Entry',
            filters: [
                ['custom_pos_profile', '=', frm.doc.pos_profile],
                ['docstatus', '=', 1],
                ['custom_date_created', 'between', [frm.doc.date_from, frm.doc.date_to]],
            ],
            fields: [
            'name', 
            'custom_cashier', 
            'custom_shift',
            'custom_pos_profile', 
            'custom_cash_count_total', 
            'custom_cash_sales',
            'custom_cash_count_and_cash_sales_difference',
            'custom_total_cashcheck_sales',]
        },
        callback: function(response){
            const pos_closings = response.message;
            if (pos_closings) {
                console.log("Closing", pos_closings )
                set_cashier_sales(frm, pos_closings);
            }
        }
    });
}


function set_cashier_sales(frm, pos_closings){
    
    let cash_count_total = 0;
    let voucher_total = 0;
    let refund_total = 0;
    let cash_sales_total = 0;
    let short_over = 0;
    
    console.log("Closing", pos_closings )
    
    frm.clear_table('cashier_sales');
    pos_closings.forEach(pos_close => {
        let child = frm.add_child('cashier_sales');
        frappe.model.set_value(child.doctype, child.name, 'name1', pos_close.custom_cashier); 
        frappe.model.set_value(child.doctype, child.name, 'shift', pos_close.custom_shift); 
        frappe.model.set_value(child.doctype, child.name, 'cash_count', pos_close.custom_cash_count_total);
        frappe.model.set_value(child.doctype, child.name, 'cash_sales', pos_close.custom_cash_sales);
        frappe.model.set_value(child.doctype, child.name, 'shortover', pos_close.custom_cash_count_and_cash_sales_difference);
        
        cash_count_total += pos_close.custom_cash_count_total;
        short_over += pos_close.custom_cash_count_and_cash_sales_difference;
        cash_sales_total += pos_close.custom_cash_sales;
       
        
    })
    
    let totals = {
        cash_count_total: cash_count_total,
        short_over: short_over,
        cash_sales_total: cash_sales_total,
    };
    
    set_cashier_sales_total(frm, totals);
    frm.refresh_field('custom_cashier_sales');
}

function set_cashier_sales_total(frm, totals){
     // Set the total number of transactions and total amount
    frm.set_value('cash_count_total', totals.cash_count_total);
    frm.set_value('shortover_total', totals.short_over);
    frm.set_value('cash_sales_total', totals.cash_sales_total);
    frm.set_value('voucher_total', totals.voucher_total);
    
    frm.refresh_field('cash_count_total');
    frm.refresh_field('shortover_total');
    frm.refresh_field('cash_sales_total');
    frm.refresh_field('voucher_total');
    frm.refresh();
    
}


function get_pending_trasactions(frm) {
    frappe.call({
         method: 'frappe.client.get_list',
        args: {
            doctype: 'POS Invoice',
            filters: [
                ['pos_profile', '=', frm.doc.pos_profile],
                ['posting_date', 'between', [frm.doc.date_from, frm.doc.date_to]],
                ['status', '=', 'Draft'],
                ['docstatus', '=', 0],
            ],
            fields: [
                'name',
                'custom_invoice_series',
                'status',
                'custom_vatable_sales',
                'custom_vat_exempt_sales',
                'custom_zero_rated_sales',
                'custom_vat_amount',
                'total_taxes_and_charges',
                'grand_total',
                'change_amount',
                'custom_pa_name',
                'customer',
                'is_return',
                'return_against',
                'custom_date_time_posted'
            ],
            limit_page_length: 1000000  // Set a high limit to get all invoices
        },
         callback: function (response) {
            let invoices = response.message || [];
            set_pending_transactions(frm, invoices)
            // console.log('Pending Invoices: ', invoices)
         }
    })
}

function set_pending_transactions(frm, invoices) {
    
    let pending_amount = 0;
    let pending_total = 0
    
    frm.clear_table('pending_transaction');
    
    invoices.forEach(invoice => {
        pending_amount += invoice.grand_total;
    });
    
    frm.add_child('pending_transaction', {
        from: frm.doc.date_from,
        to:  frm.doc.date_to,
        amount: pending_amount,
        total: invoices.length, 
    })
    
    frm.refresh_field('pending_transaction');
}


function select_date_range(frm) {
  const today = frappe.datetime.get_today();
        const today_date = new Date(today);
        let start_date, end_date = today;
        
        if (frm.doc.range === "Today") {
            start_date = today;

        } else if (frm.doc.range === "Week") {
            start_date = get_first_day_of_week(today_date);

        } else if (frm.doc.range === "Month") {
            start_date = get_first_day_of_month(today_date);
        }

        // Set the date range in the form
        set_date_range(frm, start_date, end_date);
}

function set_date_range(frm, start_date, end_date) {
    frm.set_value('date_from', `${start_date} 01:00:00`);
    frm.set_value('date_to', `${end_date} 23:59:59`);
}

function get_first_day_of_week(date) {
    const day_of_week = date.getDay(); // 0 (Sunday) to 6 (Saturday)
    const offset = day_of_week === 0 ? 6 : day_of_week - 1; // Offset to get Monday
    const first_day_of_week = new Date(date);
    first_day_of_week.setDate(date.getDate() - offset);
    return first_day_of_week.toISOString().split('T')[0];
}

function get_first_day_of_month(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
}
