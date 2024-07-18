// Copyright (c) 2024, joncsr and contributors
// For license information, please see license.txt



frappe.listview_settings['Amesco Gift Certificate'] = {
    onload: function(listview) {
        // Custom button example
        listview.page.add_inner_button('Custom Button', function() {
            frappe.msgprint('Custom button clicked!');
            // Add your custom action here
        });
    }
};


frappe.ui.form.on("Amesco Gift Certificate", {
	refresh(frm) {

	},
});
