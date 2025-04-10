custom_app.PointOfSale.Controller = class {
	constructor(wrapper) {
		this.wrapper = $(wrapper).find(".layout-main-section");
		this.page = wrapper.page;

		this.init_pos_profile();
		this.add_event_listeners();
		console.log('Controller is loaded');
	}

	init_pos_profile() {
		const savedPosProfile = localStorage.getItem('pos_profile');
		const selectedWarehouse = localStorage.getItem('selected_warehouse');
		if (savedPosProfile) {
			this.prepare_app_defaults({ pos_profile: savedPosProfile, warehouse: selectedWarehouse });
		} else {
			this.select_pos_profile();
		}
	}



	select_pos_profile() {
		const me = this;
		const dialog = new frappe.ui.Dialog({
			title: __("Select POS Profile"),
			fields: [
				{
					fieldtype: "Link",
					label: __("POS Profile"),
					options: "POS Profile",
					fieldname: "pos_profile",
					reqd: 1,
					get_query: () => ({
						query: "erpnext.accounts.doctype.pos_profile.pos_profile.pos_profile_query",
						filters: { company: frappe.defaults.get_default("company") },
					}),
				},
			],
			primary_action: function ({ pos_profile }) {
				localStorage.setItem('pos_profile', pos_profile);
				me.prepare_app_defaults({ pos_profile });
				dialog.hide();

				// Reload the page after selecting the POS profile
				location.reload();
			},
			primary_action_label: __("Select"),
		});
		dialog.show();
	}





	async prepare_app_defaults(data) {
		this.company = frappe.defaults.get_default("company");
		this.pos_profile = data.pos_profile;
		this.warehouse = data.warehouse || null;
		this.item_stock_map = {};
		this.settings = {};

		frappe.db.get_value("Stock Settings", undefined, "allow_negative_stock").then(({ message }) => {
			this.allow_negative_stock = flt(message.allow_negative_stock) || false;
		});

		frappe.call({
			method: "custom_app.customapp.page.packing_list.packing_list.get_pos_profile_data",
			args: { pos_profile: this.pos_profile },
			callback: (res) => {
				const profile = res.message;
				Object.assign(this.settings, profile);
				this.settings.customer_groups = profile.customer_groups.map((group) => group.name);
				this.make_app();
			},
		});
	}

	set_opening_entry_status() {
		this.page.set_title_sub(
			`<span class="indicator orange">
				<a class="text-muted" href="#Form/POS%20Opening%20Entry/${this.pos_opening}">
					Opened at ${moment(this.pos_opening_time).format("Do MMMM, h:mma")}
				</a>
			</span>`
		);
	}

	make_app() {
		this.prepare_dom();
		this.prepare_components();
		this.prepare_menu();
		this.add_buttons_to_toolbar();
		this.make_new_invoice();
		// this.setup_shortcuts();
	}

	prepare_dom() {
		this.wrapper.append(`<div class="point-of-sale-app"></div>`);
		this.$components_wrapper = this.wrapper.find(".point-of-sale-app");
	}

	prepare_components() {
		this.init_item_selector();
		this.init_item_details();
		this.init_item_cart();
		this.init_payments();
		this.init_recent_order_list();
		this.init_order_summary();
	}



	prepare_dom() {
		this.wrapper.append(`<div class="point-of-sale-app"></div>`);

		this.$components_wrapper = this.wrapper.find(".point-of-sale-app");
	}



	prepare_menu() {
		this.page.clear_menu();
		this.page.add_menu_item(__("Item Selector (F1)"), this.add_new_order.bind(this), false, "f1");
		this.page.add_menu_item(
			__("Pending Transaction (F2)"),
			this.order_list.bind(this),
			false,
			"f2"
		);
		this.page.add_menu_item(__("Branch Item Lookup (F4)"), this.show_branch_selection_dialog.bind(this), false, "f4");
		this.page.add_menu_item(__("Change POS Profile (F5)"), this.select_pos_profile.bind(this), false, "f5");
		this.page.add_menu_item(__("Save as Draft"), this.save_draft.bind(this), false, "f3");

	}


	add_buttons_to_toolbar() {
		const buttons = [
			{ label: __("Item Selector (F1)"), action: this.add_new_order.bind(this), shortcut: "f1" },
			{ label: __("Pending Transaction (F2"), action: this.order_list.bind(this), shortcut: "f2" },
			{ label: __("Save as Draft (F3)"), action: this.save_draft.bind(this), shortcut: "f3" },
			{ label: __("Amesco Plus Member"), action: this.amesco_plus_scan.bind(this)},
			{ label: __("Branch Item Lookup (F4)"), action: this.show_branch_selection_dialog.bind(this), shortcut: "f4" },
			// { label: __("Change POS Profile (F5)"), action: this.select_pos_profile.bind(this), shortcut: "f5" },
		];

		// Clear existing buttons to avoid duplication
		$('.page-actions .btn-custom').remove();

		buttons.forEach(btn => {
			this.page.add_button(btn.label, btn.action, { shortcut: btn.shortcut }).addClass('btn-custom');
		});
	}


	add_new_order() {
		frappe.run_serially([
			() => frappe.dom.freeze(),
			() => this.frm.reload_doc(), 
			() => this.frm.call("reset_mode_of_payments"),
			() => this.cart.load_invoice(),
			() => this.make_new_invoice(),
			() => this.item_selector.toggle_component(true),
			() => this.item_details.toggle_item_details_section(),
			() => this.toggle_recent_order_list(false),
			() => window.location.reload(),
			() => frappe.dom.unfreeze(),
		]);
	}

	order_list() {
		frappe.run_serially([
			() => frappe.dom.freeze(),
			() => this.toggle_recent_order_list(true),
			() => frappe.dom.unfreeze(),
		]);
	}

	amesco_plus_scan() {
		const me = this;
		const doc = me.frm;
	
		// Create a dialog with a data field for manual input
		let manualInputDialog = new frappe.ui.Dialog({
			title: __('Enter Scanned Data'),
			fields: [
				{
					label: 'Scanned Data',
					fieldname: 'scanned_data',
					fieldtype: 'Data',
					reqd: 1, // Make this field mandatory
					description: 'Enter the scanned data'
				}
			],
			primary_action_label: __('Submit'),
			primary_action(values) {
				let scannedData = values.scanned_data.split(',');  // Assuming the data is comma-separated
	
				if (scannedData.length >= 5) {
					// Extracting fields from the scanned data
					let user_id = scannedData[0];
					let user_name = scannedData[2];
					let email = scannedData[3];
					let earned_points = scannedData[4];
	
					// Set the extracted values in the document
					doc.set_value('custom_ameso_user', email);
					doc.set_value('custom_amesco_user_id', user_id);

					me.scannedData = scannedData;

					// Call function from pos_item_cart.js to validate scannedData
					if (me.cart && me.cart.validate_scanned_data) {
						me.cart.validate_scanned_data(scannedData);
					}
					// Display the extracted user details in another dialog
					let userDetailsDialog = new frappe.ui.Dialog({
						title: __('Scanned User Details'),
						fields: [
							{
								label: 'Name',
								fieldname: 'user_name',
								fieldtype: 'Data',
								read_only: 1,
								default: user_name
							},
							{
								label: 'Email',
								fieldname: 'email',
								fieldtype: 'Data',
								read_only: 1,
								default: email
							},
							{
								label: 'Earned Points',
								fieldname: 'points',
								fieldtype: 'Data',
								read_only: 1,
								default: earned_points
							}
						],
						primary_action_label: __('Close'),
						primary_action: function() {
							userDetailsDialog.hide();
						}
					});
	
					// Show the dialog with the user details
					userDetailsDialog.show();
	
				} else {
					frappe.msgprint(__('Invalid data format. Please enter at least 5 comma-separated values.'));
				}
	
				// Hide the manual input dialog after submission
				manualInputDialog.hide();
			}
		});
	
		// Show the manual input dialog
		manualInputDialog.show();
	}


	set_discount_log(doc, user, email) {
		doc.set_value('custom_ameso_user', updated_discount_log);
		doc.set_value('custom_manual_dicsount', updated_discount_log);
	}
	
	
	
	// Define the handle_scanned_barcode function
	handle_scanned_barcode(barcode) {
		// Logic to handle the scanned barcode
		console.log("Scanned Barcode:", barcode);
		// Add your barcode handling logic here
	}

	// prepare_buttons() {
	// 	this.page.clear_actions(); // Clear any existing buttons
	// 	this.page.add_button(__("Toggle Recent Orders"), this.toggle_recent_order.bind(this), "octicon octicon-sync", "btn-secondary");
	// 	this.page.add_button(__("Toggle Recent Orders"), this.toggle_recent_order.bind(this), "octicon octicon-sync", "btn-secondary");
	// 	this.page.add_button(__("Toggle Recent Orders"), this.toggle_recent_order.bind(this), "octicon octicon-sync", "btn-secondary");
	// 	// Add a button for "Toggle Recent Orders"
	// 	this.page.add_button(__("Toggle Pending Transaction (F6)"), this.toggle_recent_order.bind(this), "octicon octicon-sync", "btn-secondary", "Ctrl+O");

	// 	// Add a button for "Complete Order"
	// 	//this.page.add_button(__("Complete Order"), this.save_draft_invoice.bind(this), "octicon octicon-check", "btn-primary");

	// 	// Add a button for "Branch Item Lookup"
	// 	this.page.add_button(__("Branch Item Lookup"), () => {
	// 		this.show_branch_selection_dialog()
	// 	}, "octicon octicon-search", "btn-secondary");
	// }

	// setup_shortcuts() {
	// 	// Add shortcut for "Toggle Recent Orders" - F1
	// 	frappe.ui.keys.add_shortcut({
	// 		shortcut: 'f1',
	// 		action: () => this.toggle_recent_order(),
	// 		description: __('Toggle Recent Orders'),
	// 		page: this.page
	// 	});

	// 	// Add shortcut for "Complete Order" - F2
	// 	frappe.ui.keys.add_shortcut({
	// 		shortcut: 'f2',
	// 		action: () => this.save_draft_invoice(),
	// 		description: __('Complete Order'),
	// 		page: this.page
	// 	});

	// 	// Add shortcut for "Branch Item Lookup" - F3
	// 	frappe.ui.keys.add_shortcut({
	// 		shortcut: 'f3',
	// 		action: () => this.show_branch_selection_dialog(),
	// 		description: __('Branch Item Lookup'),
	// 		page: this.page
	// 	});
	// }

	// buttons() {
	// 	page.set_secondary_action('Refresh', () => refresh(), 'octicon octicon-sync')
	// }

	show_branch_selection_dialog() {
		const selectedWarehouse = localStorage.getItem('selected_warehouse') || '';
		const dialog = new frappe.ui.Dialog({
			title: __("Select Branch"),
			fields: [
				{
					fieldtype: "Link",
					label: __("Warehouse"),
					options: "Warehouse",
					fieldname: "warehouse",
					default: selectedWarehouse,
					reqd: 1,
					get_query: () => ({
						query: "custom_app.customapp.page.packing_list.packing_list.warehouse_query",
						filters: { company: frappe.defaults.get_default("company") }
					})
				}
			],
			primary_action: function (data) {
				// console.log("Selected Warehouse:", data.warehouse);
				// Save the selected warehouse to local storage
				localStorage.setItem('selected_warehouse', data.warehouse);
				// Refresh the POS with the selected warehouse
				location.reload();
				dialog.hide();
			},
			primary_action_label: __("View"),
			secondary_action_label: __("Clear"), // Adding a clear button
			secondary_action: function () {
				// Clear the selected warehouse from local storage
				localStorage.removeItem('selected_warehouse');
				// Refresh the POS to reflect the change
				location.reload();
				dialog.hide();
			}
		});

		dialog.show();
	}



	prepare_profile_selection() {
		const me = this;

		// Create a select field for Warehouses
		const warehouseField = this.page.add_field({
			label: 'Branch',
			fieldtype: 'Select',
			fieldname: 'warehouse',
			options: [],
			change() {
				const selectedWarehouse = warehouseField.get_value();
				if (selectedWarehouse) {
					me.set_warehouse(selectedWarehouse); // where do i put set_warehouse
				}
			}
		});

		// Fetch Warehouses and populate the select options
		frappe.call({
			method: "custom_app.customapp.page.packing_list.packing_list.warehouse_query",
			args: {
				doctype: "Warehouse",
				txt: "",
				searchfield: "name",
				start: 0,
				page_len: 100,
				filters: {}
			},
			callback: function (r) {
				if (r.message) {
					// console.log(r.message)
					const warehouses = r.message.map(warehouse => warehouse[0]);
					warehouseField.df.options = [...warehouses];
					warehouseField.refresh();
				}
			}
		});
	}

	// remove pos_profile when when changing page, and logout
	add_event_listeners() {

		// Remove POS Profile from local storage on logout
		frappe.logout = (function (originalLogout) {
			return function () {
				localStorage.removeItem('pos_profile');
				return originalLogout.apply(this, arguments);
			};
		})(frappe.logout);
	}


	open_form_view() {
		frappe.model.sync(this.frm.doc);
		frappe.set_route("Form", this.frm.doc.doctype, this.frm.doc.name);
	}

	toggle_recent_order() {
		const show = this.recent_order_list.$component.is(":hidden");
		this.toggle_recent_order_list(show);
	}

	async save_draft_invoice() {
		
		if (this.passwordDialog) {
			this.passwordDialog.hide();
			this.passwordDialog.$wrapper.remove();
			delete this.passwordDialog;
		}

		if (!this.$components_wrapper.is(":visible")) return;
	
		let payment_amount = this.frm.doc.payments.reduce((sum, payment) => sum + payment.amount, 0);

		if (parseFloat(payment_amount.toFixed(2)) < this.frm.doc.grand_total) {

			// Show dialog indicating insufficient payment
			const insufficientPaymentDialog = new frappe.ui.Dialog({
				title: __('Insufficient Payment'),
				primary_action_label: __('OK'),
				primary_action: () => {
					insufficientPaymentDialog.hide();
				}
			});

			insufficientPaymentDialog.body.innerHTML = `
				<div style="text-align: center; font-size: 30px; margin: 20px 0;">
					${__('The payment amount is not enough to cover the grand total.')}
				</div>
			`;

			insufficientPaymentDialog.show();
			return; // Exit the function if payment is not sufficient
		}
	
		if (this.frm.doc.items.length === 0) {
			frappe.show_alert({
				message: __("You must add at least one item to complete the order."),
				indicator: "red",
			});
			frappe.utils.play_sound("error");
			return;
		}
	
		

		// Destroy any previous password dialogs
		// if (this.passwordDialog) {
		// 	this.passwordDialog.$wrapper.remove();
		// 	delete this.passwordDialog;
		// }
	
		// Create and show the password dialog
		this.passwordDialog = new frappe.ui.Dialog({
			title: __('Enter Your Password'),
			fields: [
				{
					fieldtype: 'HTML',
					fieldname: 'password_html',
					options: `
						<div class="form-group">
							<label for="password_field">${__('Password')}</label>
							<input type="password" id="sumbit_password" class="form-control" required>
						</div>
					`
				}
			],
			primary_action_label: __('Ok'),
			primary_action: () => {
				let password = document.getElementById('sumbit_password').value;
				let errorOccurred = false;
				const user_data = JSON.parse(localStorage.getItem('user_data'));

				if (user_data && user_data.password === password) {
					this.set_pharmacist_assist(this.frm, user_data.name);
					this.frm
						.save(undefined, undefined, undefined, () => {
							// Error handling during save
							frappe.show_alert({
								message: ("There was an error saving the document."),
								indicator: "red",
							});
							frappe.utils.play_sound("error");
							errorOccurred = true;  // Set error flag
						})
						.then(() => {
							if (errorOccurred) return;  // Skip further actions if an error occurred
			
							this.passwordDialog.hide();
			
							// Load the order summary and print the receipt
							this.order_summary.load_summary_of(this.frm.doc, true);
							this.order_summary.print_receipt();
			
							// Remove stored data from local storage
							localStorage.removeItem('posCartItems');
			
							// Show alert after printing
							frappe.show_alert({
								message: ("Invoice Printed"),
								indicator: "blue",
							});
			
							// Only run this block if no error occurred
							frappe.run_serially([
								() => frappe.dom.freeze(),
								() => this.make_new_invoice(),
								() => frappe.dom.unfreeze(),
								() => window.location.reload()
							]);
						})
						.catch((err) => {
							// Handle any unanticipated errors
							frappe.show_alert({
								message: __('An unexpected error occurred while saving the document. Please try again.'),
								indicator: 'red'
							});
							errorOccurred = true;  // Set error flag
						});
				} else {

				frappe.call({
					method: "custom_app.customapp.page.packing_list.packing_list.get_user_details_by_password",
					args: { password: password },
					callback: (r) => {
						if (r.message && r.message.name) {

							localStorage.setItem('user_data', JSON.stringify(r.message));

							this.set_pharmacist_assist(this.frm, r.message.name);
			
							this.frm
								.save(undefined, undefined, undefined, () => {
									// Error handling during save
									frappe.show_alert({
										message: ("There was an error saving the document."),
										indicator: "red",
									});
									frappe.utils.play_sound("error");
									errorOccurred = true;  // Set error flag
								})
								.then(() => {
									if (errorOccurred) return;  // Skip further actions if an error occurred
			
									this.passwordDialog.hide();
			
									// Load the order summary and print the receipt
									this.order_summary.load_summary_of(this.frm.doc, true);
									this.order_summary.print_receipt();
			
									// Remove stored data from local storage
									localStorage.removeItem('posCartItems');
			
									// Show alert after printing
									frappe.show_alert({
										message: ("Invoice Printed"),
										indicator: "blue",
									});
			
									// Only run this block if no error occurred
									frappe.run_serially([
										() => frappe.dom.freeze(),
										() => this.make_new_invoice(),
										() => frappe.dom.unfreeze(),
										() => window.location.reload()
									]);
								})
								.catch((err) => {
									// Handle any unanticipated errors
									frappe.show_alert({
										message: __('An unexpected error occurred while saving the document. Please try again.'),
										indicator: 'red'
									});
									errorOccurred = true;  // Set error flag
								});

						} else {
							// Handle incorrect password
							frappe.show_alert({
								message: ('Incorrect password'),
								indicator: 'red'
							});
							errorOccurred = true;  // Set error flag
						}
					}
				});
			}

			}
			
		});


	
		this.passwordDialog.$wrapper.on('shown.bs.modal', () => {
			// Use a short timeout to ensure the dialog is fully rendered
			setTimeout(() => {
				const passwordField = document.getElementById('sumbit_password');
				if (passwordField) {
					passwordField.focus();
				}
			}, 100); // Increase delay if necessary
		});
		
		this.passwordDialog.show();
	}
	

	// save_draft_invoice() {
	// 	if (!this.$components_wrapper.is(":visible")) return;
	// 	let payment_amount = this.frm.doc.payments.reduce((sum, payment) => sum + payment.amount, 0);


	// 	if (payment_amount < this.frm.doc.grand_total) {
	// 		// Show dialog indicating insufficient payment
	// 		const insufficientPaymentDialog = new frappe.ui.Dialog({
	// 			title: __('Insufficient Payment'),
	// 			primary_action_label: __('OK'),
	// 			primary_action: () => {
	// 				insufficientPaymentDialog.hide();
	// 			}
	// 		});

	// 		insufficientPaymentDialog.body.innerHTML = `
	// 			<div style="text-align: center; font-size: 30px; margin: 20px 0;">
	// 				${__('The payment amount is not enough to cover the grand total.')}
	// 			</div>
	// 		`;

	// 		insufficientPaymentDialog.show();
	// 		return; // Exit the function if payment is not sufficient
	// 	}

	// 	if (this.frm.doc.items.length == 0) {
	// 		frappe.show_alert({
	// 			message: __("You must add atleast one item to complete the order."),
	// 			indicator: "red",
	// 		});
	// 		frappe.utils.play_sound("error");
	// 		return;
	// 	}

	// 	const passwordDialog = new frappe.ui.Dialog({
	// 		title: __('Enter Your Password'),
	// 		fields: [
	// 			{
	// 				fieldname: 'password',
	// 				fieldtype: 'Password',
	// 				label: __('Password'),
	// 				reqd: 1
	// 			}
	// 		],
	// 		primary_action_label: __('Ok'),
	// 		primary_action: (values) => {
    //             let password = values.password;
	// 			let errorOccurred = false;
				
    //             frappe.call({
    //                 method: "custom_app.customapp.page.packing_list.packing_list.get_user_details_by_password",
    //                 args: { password: password },
    //                 callback: (r) => {
    //                     if (r.message) {
    //                         if(r.message.name) {
    //                             this.set_pharmacist_assist(this.frm, r.message.name)
	// 							console.log(this.frm, r.message.name)
    //                             this.frm
    //                                 .save(undefined, undefined, undefined, () => {
    //                                     frappe.show_alert({
    //                                         message: ("There was an error saving the document."),
    //                                         indicator: "red",
    //                                     });
    //                                     frappe.utils.play_sound("error");
	// 									errorOccurred = true;  
    //                                 })
    //                                 .then(() => {

	// 									if (errorOccurred) return; 

    //                                     frappe.run_serially([
    //                                         () => frappe.dom.freeze(),
    //                                         () => this.make_new_invoice(),
    //                                         () => frappe.dom.unfreeze(),
	// 										() => window.location.reload()

    //                                     ]);
    //                                     passwordDialog.hide();

    //                                     this.order_summary.load_summary_of(this.frm.doc, true);
    //                                     this.order_summary.print_receipt();
    //                                    // reload after successfull entered password
    //                                     localStorage.removeItem('posCartItems'); // remove stored data from local storage
    //                                     frappe.show_alert({
    //                                         message: ("Invoice Printed"),
    //                                         indicator: "blue",
    //                                     }).catch((err) => {
	// 										// Handle any unanticipated errors
	// 										frappe.show_alert({
	// 											message: __('An unexpected error occurred while saving the document. Please try again.'),
	// 											indicator: 'red'
	// 										});
	// 										errorOccurred = true;  // Set error flag
	// 									});
    //                                 });
    //                         }else{
    //                             frappe.show_alert({
    //                                 message: ('Incorrect password'),
    //                                 indicator: 'red'
    //                             });
	// 							errorOccurred = true;  
    //                         }
    //                     } else {
    //                         frappe.show_alert({
    //                             message: ('Incorrect password'),
    //                             indicator: 'red'
    //                         });
    //                     }
    //                 }
    //             });
    //         }
	// 	})
	// 	passwordDialog.show();
	// }


	save_draft() {
		// Cleanup any existing dialog
		if (this.passwordDialog) {
			this.passwordDialog.hide();
			this.passwordDialog.$wrapper.remove();
			delete this.passwordDialog;
		}
	
		if (!this.$components_wrapper.is(":visible")) return;
	
		if (this.frm.doc.items.length === 0) {
			frappe.show_alert({
				message: __("You must add at least one item to complete the order."),
				indicator: "red",
			});
			frappe.utils.play_sound("error");
			return;
		}
	
		// Create a new password dialog
		this.passwordDialog = new frappe.ui.Dialog({
			title: __('Enter Your Password'),
			fields: [
				{
					fieldtype: 'HTML',
					fieldname: 'password_html',
					options: `
						<div class="form-group">
							<label for="password_field">${__('Password')}</label>
							<input type="password" id="password_field" class="form-control" required>
						</div>
					`
				}
			],
			primary_action_label: __('Ok'),
			primary_action: () => {
				let password = document.getElementById('password_field').value;
			
				let errorOccurred = false;  // Flag to track errors
			
				frappe.call({
					method: "custom_app.customapp.page.packing_list.packing_list.get_user_details_by_password",
					args: { password: password },
					callback: (r) => {
						if (r.message && r.message.name) {
							this.set_pharmacist_assist(this.frm, r.message.name);
			
							this.frm
								.save(undefined, undefined, undefined, () => {
									// Error handling during save
									frappe.show_alert({
										message: ("There was an error saving the document."),
										indicator: "red",
									});
									frappe.utils.play_sound("error");
									errorOccurred = true;  // Set error flag
								})
								.then(() => {
									if (errorOccurred) return;  // Skip further actions if an error occurred
			
									this.passwordDialog.hide();
			
									// Load the order summary and print the receipt
									this.order_summary.load_summary_of(this.frm.doc, true);
									this.order_summary.print_receipt();
			
									// Remove stored data from local storage
									localStorage.removeItem('posCartItems');
			
									// Show alert after printing
									frappe.show_alert({
										message: ("Invoice Printed"),
										indicator: "blue",
									});
			
									// Only run this block if no error occurred
									frappe.run_serially([
										() => frappe.dom.freeze(),
										() => this.make_new_invoice(),
										() => frappe.dom.unfreeze(),
										() => window.location.reload()
									]);
								})
								.catch((err) => {
									// Handle any unanticipated errors
									console.error("Unexpected error:", err);
									errorOccurred = true;  // Set error flag
								});
						} else {
							// Handle incorrect password
							frappe.show_alert({
								message: ('Incorrect password'),
								indicator: 'red'
							});
							errorOccurred = true;  // Set error flag
						}
					}
				});
			}
		});
	
		// Ensure the password field gains focus every time the dialog is opened
		this.passwordDialog.$wrapper.on('shown.bs.modal', () => {
			// Use a short timeout to ensure the dialog is fully rendered
			setTimeout(() => {
				const passwordField = document.getElementById('password_field');
				if (passwordField) {
					passwordField.focus();
				}
			}, 100); // Increase delay if necessary
		});
	
		// Show the dialog
		this.passwordDialog.show();
	}
	

	set_pharmacist_assist(frm, user) {
		frappe.model.set_value(frm.doc.doctype, frm.doc.name, "custom_pharmacist_assistant", user);
		frm.refresh_field('custom_pharmacist_assistant');
	}

	close_pos() {
		if (!this.$components_wrapper.is(":visible")) return;

		let voucher = frappe.model.get_new_doc("POS Closing Entry");
		voucher.pos_profile = this.frm.doc.pos_profile;
		voucher.user = frappe.session.user;
		voucher.company = this.frm.doc.company;
		voucher.pos_opening_entry = this.pos_opening;
		voucher.period_end_date = frappe.datetime.now_datetime();
		voucher.posting_date = frappe.datetime.now_date();
		voucher.posting_time = frappe.datetime.now_time();
		frappe.set_route("Form", "POS Closing Entry", voucher.name);
	}

	init_item_selector() {
		this.item_selector = new custom_app.PointOfSale.ItemSelector({
			wrapper: this.$components_wrapper,
			pos_profile: this.pos_profile,
			settings: this.settings,
			events: {
				item_selected: async (args) => {
					frappe.call({
						method: 'custom_app.customapp.page.packing_list.packing_list.get_pos_warehouse',
						args: {
							pos_profile: this.pos_profile
						},
						callback: (r) => {
							if (r.message) {
								const posWarehouse = r.message;
								const selectedWarehouse = localStorage.getItem('selected_warehouse');

								if (posWarehouse === selectedWarehouse || selectedWarehouse === null) {
									this.on_cart_update(args); // Proceed if warehouses match
								} else {
									frappe.show_alert({
										message: __("You cannot add items from a different branch."),
										indicator: "red",
									});
									frappe.utils.play_sound("error");
									return;
								}
							} else {

								frappe.show_alert({
									message: __("Could not retrieve the warehouse for the POS Profile."),
									indicator: "red",
								});
								frappe.utils.play_sound("error");
								return;
							}
						}
					});
				},
				get_frm: () => this.frm || {},
				get_pos_profile: () => {
					return this.pos_profile
				}
			},
		});
	}

	init_item_cart() {
		this.cart = new custom_app.PointOfSale.ItemCart({
			wrapper: this.$components_wrapper,
			settings: this.settings,
			events: {
				get_frm: () => this.frm,

				

				cart_item_clicked: (item, frm) => {


					const item_row = this.get_item_from_frm(item);
					this.item_details.toggle_item_details_section(item_row);
				},

				numpad_event: (value, action) => this.update_item_field(value, action),

				checkout: () => this.save_and_checkout(),

				edit_cart: () => this.payment.edit_cart(),

				customer_details_updated: (details) => {
					this.customer_details = details;
					// will add/remove LP payment method
					this.payment.render_loyalty_points_payment_mode();
				},
			},

			
		});

	}

	init_item_details() {
		this.item_details = new custom_app.PointOfSale.ItemDetails({
			wrapper: this.$components_wrapper,
			settings: this.settings,
			events: {
				get_frm: () => this.frm,

				toggle_item_selector: (minimize) => {
					this.item_selector.resize_selector(minimize);
					this.cart.toggle_numpad(minimize);
				},

				form_updated: (item, field, value) => {
					const item_row = frappe.model.get_doc(item.doctype, item.name);
					if (item_row && item_row[field] != value) {
						const args = {
							field,
							value,
							item: this.item_details.current_item,
						};
						return this.on_cart_update(args);
					}

					return Promise.resolve();
				},

				highlight_cart_item: (item) => {
					const cart_item = this.cart.get_cart_item(item);
					this.cart.toggle_item_highlight(cart_item);
				},

				item_field_focused: (fieldname) => {
					this.cart.toggle_numpad_field_edit(fieldname);
				},
				set_value_in_current_cart_item: (selector, value) => {
					this.cart.update_selector_value_in_cart_item(
						selector,
						value,
						this.item_details.current_item
					);
				},
				clone_new_batch_item_in_frm: (batch_serial_map, item) => {
					// called if serial nos are 'auto_selected' and if those serial nos belongs to multiple batches
					// for each unique batch new item row is added in the form & cart
					Object.keys(batch_serial_map).forEach((batch) => {
						const item_to_clone = this.frm.doc.items.find((i) => i.name == item.name);
						const new_row = this.frm.add_child("items", { ...item_to_clone });
						// update new serialno and batch
						new_row.batch_no = batch;
						new_row.serial_no = batch_serial_map[batch].join(`\n`);
						new_row.qty = batch_serial_map[batch].length;
						this.frm.doc.items.forEach((row) => {
							if (item.item_code === row.item_code) {
								this.update_cart_html(row);
							}
						});
					});
				},
				remove_item_from_cart: () => this.remove_item_from_cart(),
				get_item_stock_map: () => this.item_stock_map,
				close_item_details: () => {
					this.item_details.toggle_item_details_section(null);
					this.cart.prev_action = null;
					this.cart.toggle_item_highlight();
				},
				get_available_stock: (item_code, warehouse) => this.get_available_stock(item_code, warehouse),
			},
		});
	}

	init_payments() {
		this.payment = new custom_app.PointOfSale.Payment({
			wrapper: this.$components_wrapper,
			events: {
				get_frm: () => this.frm || {},

				get_customer_details: () => this.customer_details || {},

				toggle_other_sections: (show) => {
					if (show) {
						this.item_details.$component.is(":visible")
							? this.item_details.$component.css("display", "none")
							: "";
						this.item_selector.toggle_component(false);
					} else {
						this.item_selector.toggle_component(true);
					}
				},

				submit_invoice: () => {
					this.frm.savesubmit().then((r) => {
						this.toggle_components(false);
						this.order_summary.toggle_component(true);
						this.order_summary.load_summary_of(this.frm.doc, true);
						frappe.show_alert({
							indicator: "green",
							message: __("POS invoice {0} created succesfully", [r.doc.name]),
						});
					});
				},

				save_as_draft: () => {
					this.save_draft_invoice()
				}

			},
		});
	}

	init_recent_order_list() {
		this.recent_order_list = new custom_app.PointOfSale.PastOrderList({
			wrapper: this.$components_wrapper,
			events: {
				open_invoice_data: (name) => {
					frappe.db.get_doc("POS Invoice", name).then((doc) => {
						this.order_summary.load_summary_of(doc);
					});
				},
				// return pos profile
				pos_profile: () => {
					return this.pos_profile
				},
				reset_summary: () => this.order_summary.toggle_summary_placeholder(true),
			},
		});
	}

	init_order_summary() {
		this.order_summary = new custom_app.PointOfSale.PastOrderSummary({
			wrapper: this.$components_wrapper,
			events: {
				get_frm: () => this.frm,

				process_return: (name) => {
					this.recent_order_list.toggle_component(false);
					frappe.db.get_doc("POS Invoice", name).then((doc) => {
						frappe.run_serially([
							() => this.make_return_invoice(doc),
							() => this.cart.load_invoice(),
							() => this.item_selector.toggle_component(true),
						]);
					});
				},
				edit_order: (name) => {
					this.oic_edit_confirm(name); // Call password authentication before edit order
				},

				delete_order: (name) => {
					frappe.model.delete_doc(this.frm.doc.doctype, name, () => {
						this.recent_order_list.refresh_list();
					});
				},
				new_order: () => {
					frappe.run_serially([
						() => frappe.dom.freeze(),
						() => this.make_new_invoice(),
						() => this.item_selector.toggle_component(true),
						() => frappe.dom.unfreeze(),
					]);
				},
			},
		});
	}


	oic_edit_confirm(name) {
		// Cleanup any existing dialog
		if (this.passwordDialog) {
			this.passwordDialog.$wrapper.remove();
			delete this.passwordDialog;
		}
	
		let isAuthorized = false;
	
		// Create a new password dialog
		this.passwordDialog = new frappe.ui.Dialog({
			title: __('Authorization Required OIC'),
			fields: [
				{
					fieldtype: 'HTML',
					fieldname: 'password_html',
					options: `
						<div class="form-group">
							<label for="password_field">${__('Password')}</label>
							<input type="password" id="password_field" class="form-control" required>
						</div>
					`
				}
			],
			primary_action_label: __('Authorize'),
			primary_action: () => {
				let password = document.getElementById('password_field').value;
	
				frappe.call({
					method: "custom_app.customapp.page.packing_list.packing_list.confirm_user_password",
					args: { password: password },
					callback: (r) => {
						if (r.message) {
							if (r.message.name) {
								isAuthorized = true;
								frappe.show_alert({
									message: __('Verified'),
									indicator: 'green'
								});
	
								frappe.run_serially([
									() => this.frm.refresh(name),
									() => this.cart.load_invoice(),
									() => this.item_selector.toggle_component(true),
									() => this.toggle_recent_order_list(false),
									() => this.item_selector.load_items_data()
								]).then(() => {
									this.passwordDialog.hide();
								});
							} else {
								frappe.show_alert({
									message: __('Incorrect password or user is not an OIC'),
									indicator: 'red'
								});
							}
						} else {
							frappe.show_alert({
								message: __('Incorrect password or user is not an OIC'),
								indicator: 'red'
							});
						}
					}
				});
			}
		});
	
		// Bind an event to reload the window when the dialog is hidden
		this.passwordDialog.$wrapper.on('hidden.bs.modal', () => {
			if (!isAuthorized) {
				window.location.reload();
			}
		});
	
		// Show the dialog
		this.passwordDialog.show();
	
		// Ensure the password field gains focus every time the dialog is opened
		this.passwordDialog.$wrapper.on('shown.bs.modal', () => {
			setTimeout(() => {
				document.getElementById('password_field').focus();
			}, 100); // Slight delay to ensure field is rendered before focusing
		});
	}
	



	toggle_recent_order_list(show) {
		this.toggle_components(!show);
		this.recent_order_list.toggle_component(show);
		this.order_summary.toggle_component(show);
	}

	toggle_components(show) {
		this.cart.toggle_component(show);
		this.item_selector.toggle_component(show);

		// do not show item details or payment if recent order is toggled off
		!show ? this.item_details.toggle_component(false) || this.payment.toggle_component(false) : "";
	}

	make_new_invoice() {
		return frappe.run_serially([
			() => frappe.dom.freeze(),
			() => this.make_sales_invoice_frm(),
			() => this.set_pos_profile_data(),
			() => this.set_pos_profile_status(),
			() => this.cart.load_invoice(),
			() => frappe.dom.unfreeze(),
		]);
	}

	make_sales_invoice_frm() {
		const doctype = "POS Invoice";
		return new Promise((resolve) => {
			if (this.frm) {
				this.frm = this.get_new_frm(this.frm);
				// console.log(this.frm.doc.payment)
				this.frm.doc.items = [];
				this.frm.doc.is_pos = 1;
				resolve();
			} else {
				frappe.model.with_doctype(doctype, () => {
					this.frm = this.get_new_frm();
					// console.log(this.frm.doc.payments)
					this.frm.doc.items = [];
					this.frm.doc.is_pos = 1;
					resolve();
				});
			}
		});
	}

	get_new_frm(_frm) {
		const doctype = "POS Invoice";
		const page = $("<div>");
		const frm = _frm || new frappe.ui.form.Form(doctype, page, false);
		const name = frappe.model.make_new_doc_and_get_name(doctype, true);
		frm.refresh(name);

		return frm;
	}

	async make_return_invoice(doc) {
		frappe.dom.freeze();
		this.frm = this.get_new_frm(this.frm);
		this.frm.doc.items = [];
		return frappe.call({
			method: "erpnext.accounts.doctype.order_list.order_list.make_sales_return",
			args: {
				source_name: doc.name,
				target_doc: this.frm.doc,
			},
			callback: (r) => {
				frappe.model.sync(r.message);
				frappe.get_doc(r.message.doctype, r.message.name).__run_link_triggers = false;
				this.set_pos_profile_data().then(() => {
					frappe.dom.unfreeze();
				});
			},
		});
	}

	set_pos_profile_data() {
		if (this.company && !this.frm.doc.company) this.frm.doc.company = this.company;
		if (
			(this.pos_profile && !this.frm.doc.pos_profile) |
			(this.frm.doc.is_return && this.pos_profile != this.frm.doc.pos_profile)
		) {
			this.frm.doc.pos_profile = this.pos_profile;
		}

		if (!this.frm.doc.company) return;

		return this.frm.trigger("set_pos_data");
	}

	set_pos_profile_status() {
		this.page.set_indicator(this.pos_profile, "blue");

	}

	async on_cart_update(args) {
		frappe.dom.freeze();
		let item_row = undefined;
		try {
			let { field, value, item } = args;
			item_row = this.get_item_from_frm(item);
			const item_row_exists = !$.isEmptyObject(item_row);

			const from_selector = field === "qty" && value === "+1";
			if (from_selector) value = flt(item_row.stock_qty) + flt(value);

			if (item_row_exists) {
				if (field === "qty") value = flt(value);

				if (["qty", "conversion_factor"].includes(field) && value > 0 && !this.allow_negative_stock) {
					const qty_needed =
						field === "qty" ? value * item_row.conversion_factor : item_row.qty * value;
					await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
				}

				if (this.is_current_item_being_edited(item_row) || from_selector) {
					await frappe.model.set_value(item_row.doctype, item_row.name, field, value);
					this.update_cart_html(item_row);

					await this.auto_add_batch(item_row);
				}
			} else {
				if (!this.frm.doc.customer) return this.raise_customer_selection_alert();

				const { item_code, batch_no, serial_no, rate, uom } = item;

				if (!item_code) return;

				const new_item = { item_code, batch_no, rate, uom, [field]: value };

				if (serial_no && serial_no !== "undefined") {
					await this.check_serial_no_availablilty(item_code, this.frm.doc.set_warehouse, serial_no);
					new_item["serial_no"] = serial_no;
				}

				if (field === "serial_no") new_item["qty"] = value.split(`\n`).length || 0;

				item_row = this.frm.add_child("items", new_item);

				if (field === "qty" && value !== 0 && !this.allow_negative_stock) {
					const qty_needed = value * item_row.conversion_factor;
					await this.check_stock_availability(item_row, qty_needed, this.frm.doc.set_warehouse);
				}

				await this.trigger_new_item_events(item_row);

				this.update_cart_html(item_row);

				await this.auto_add_batch(item_row);

				// if (this.item_details.$component.is(":visible")) this.edit_item_details_of(item_row);

				// if (
				// 	this.check_serial_batch_selection_needed(item_row) &&
				// 	!this.item_details.$component.is(":visible")
				// )
				// 	this.edit_item_details_of(item_row);
			}
		} catch (error) {
			console.log(error);
		} finally {
			frappe.dom.unfreeze();
			return item_row; // eslint-disable-line no-unsafe-finally
		}
	}

	raise_customer_selection_alert() {
		frappe.dom.unfreeze();
		frappe.show_alert({
			message: __("You must select a customer before adding an item."),
			indicator: "orange",
		});
		frappe.utils.play_sound("error");
	}

	get_item_from_frm({ name, item_code, batch_no, uom, rate }) {
		let item_row = null;
		if (name) {
			item_row = this.frm.doc.items.find((i) => i.name == name);
		} else {
			// if item is clicked twice from item selector
			// then "item_code, batch_no, uom, rate" will help in getting the exact item
			// to increase the qty by one
			const has_batch_no = batch_no !== "null" && batch_no !== null;
			item_row = this.frm.doc.items.find(
				(i) =>
					i.item_code === item_code &&
					(!has_batch_no || (has_batch_no && i.batch_no === batch_no)) &&
					i.uom === uom &&
					i.rate === flt(rate)
			);
		}

		return item_row || {};
	}

	edit_item_details_of(item_row) {
		this.item_details.toggle_item_details_section(item_row);
	}

	is_current_item_being_edited(item_row) {
		return item_row.name == this.item_details.current_item.name;
	}

	update_cart_html(item_row, remove_item) {
		this.cart.update_item_html(item_row, remove_item);
		this.cart.update_totals_section(this.frm);
	}

	check_serial_batch_selection_needed(item_row) {
		// right now item details is shown for every type of item.
		// if item details is not shown for every item then this fn will be needed
		const serialized = item_row.has_serial_no;
		const batched = item_row.has_batch_no;
		const no_serial_selected = !item_row.serial_no;
		const no_batch_selected = !item_row.batch_no;

		if (
			(serialized && no_serial_selected) ||
			(batched && no_batch_selected) ||
			(serialized && batched && (no_batch_selected || no_serial_selected))
		) {
			return true;
		}
		return false;
	}

	async trigger_new_item_events(item_row) {
		await this.frm.script_manager.trigger("item_code", item_row.doctype, item_row.name);
		await this.frm.script_manager.trigger("qty", item_row.doctype, item_row.name);
	}

	async check_stock_availability(item_row, qty_needed, warehouse) {
		const resp = (await this.get_available_stock(item_row.item_code, warehouse)).message;
		const available_qty = resp[0];
		const is_stock_item = resp[1];

		frappe.dom.unfreeze();
		const bold_uom = item_row.stock_uom.bold();
		const bold_item_code = item_row.item_code.bold();
		const bold_warehouse = warehouse.bold();
		const bold_available_qty = available_qty.toString().bold();
		if (!(available_qty > 0)) {
			if (is_stock_item) {
				frappe.model.clear_doc(item_row.doctype, item_row.name);
				frappe.throw({
					title: __("Not Available"),
					message: __("Item Code: {0} is not available under warehouse {1}.", [
						bold_item_code,
						bold_warehouse,
					]),
				});
			} else {
				return;
			}
		} else if (is_stock_item && available_qty < qty_needed) {
			frappe.throw({
				message: __(
					"Stock quantity not enough for Item Code: {0} under warehouse {1}. Available quantity {2} {3}.",
					[bold_item_code, bold_warehouse, bold_available_qty, bold_uom]
				),
				indicator: "orange",
			});
			frappe.utils.play_sound("error");
		}
		frappe.dom.freeze();
	}

	async check_serial_no_availablilty(item_code, warehouse, serial_no) {
		const method = "erpnext.stock.doctype.serial_no.serial_no.get_pos_reserved_serial_nos";
		const args = { filters: { item_code, warehouse } };
		const res = await frappe.call({ method, args });

		if (res.message.includes(serial_no)) {
			frappe.throw({
				title: ("Not Available"),
				message: ("Serial No: {0} has already been transacted into another POS Invoice.", [
					serial_no.bold(),
				]),
			});
		}
	}

	get_available_stock(item_code, warehouse) {
		const me = this;
		return frappe.call({
			method: "erpnext.accounts.doctype.pos_invoice.pos_invoice.get_stock_availability",
			args: {
				item_code: item_code,
				warehouse: warehouse,
			},
			callback(res) {
				if (!me.item_stock_map[item_code]) me.item_stock_map[item_code] = {};
				me.item_stock_map[item_code][warehouse] = res.message;
			},
		});
	}

	async auto_add_batch(item_row) {
		try {
			let item_details = await frappe.db.get_value('Item', item_row.item_code, 'has_batch_no');
	
			// If the item does not require batch tracking, skip batch validation
			if (!item_details.message.has_batch_no) {
				frappe.model.set_value(item_row.doctype, item_row.name, {
					qty: item_row.qty
				});
				return; // Exit the function as no batch validation is required
			}
	
			let required_qty = item_row.qty;  // POS item quantity
			let batch_entries = []; // List to store batch allocations
	
			// Step 1: Fetch batches for the item with a valid expiry date, ordered by expiry date
			let batches = await frappe.db.get_list('Batch', {
				filters: {
					item: item_row.item_code,
					expiry_date: ['>=', frappe.datetime.now_date()],
					batch_qty: ['>', 0] // Exclude batches with zero quantity
				},
				fields: ['name', 'expiry_date', 'batch_qty'],
				order_by: 'expiry_date asc', // Fetch batches with nearest expiry date first
			});
	
			if (!batches.length) {
				frappe.throw(`No valid batches available with stock for item ${item_row.item_code} in warehouse ${item_row.warehouse}.`);
			}
	
			// Step 2: Allocate quantity from nearest expiry batch first
			for (let batch of batches) {
				if (required_qty <= 0) break; // Stop once the required quantity is fulfilled
	
				// Fetch the batch stock in the current warehouse
				let batch_qty = await frappe.call({
					method: "erpnext.stock.doctype.batch.batch.get_batch_qty",
					args: {
						batch_no: batch.name,
						warehouse: this.frm.doc.set_warehouse,
						item_code: item_row.item_code
					}
				});
	
				let available_qty = batch_qty.message || 0;
	
				if (available_qty > 0) {
					let qty_to_take = Math.min(available_qty, required_qty); // Take as much as needed
	
					batch_entries.push({
						batch_no: batch.name,
						qty: qty_to_take,
						warehouse: this.frm.doc.set_warehouse
					});
	
					required_qty -= qty_to_take; // Reduce remaining required quantity
				}
			}
	
			// Step 3: Check if all required quantity was allocated
			if (required_qty > 0) {
				frappe.throw(`Insufficient batch stock for item ${item_row.item_code} in warehouse ${item_row.warehouse}.`);
			}
	
			// Step 4: Create the Serial and Batch Bundle
			const res = await frappe.call({
				method: "erpnext.stock.doctype.serial_and_batch_bundle.serial_and_batch_bundle.add_serial_batch_ledgers",
				args: {
					entries: batch_entries,
					child_row: item_row,
					doc: this.frm.doc,
					warehouse: this.frm.doc.set_warehouse
				},
			});
	
			// Step 5: Update the POS Invoice Item with batch details
			frappe.model.set_value(item_row.doctype, item_row.name, {
				serial_and_batch_bundle: res.message.name,
				qty: item_row.qty, // Set to requested quantity
			});
	
		} catch (error) {
			frappe.show_alert({
				message: __('Batch fetch failed. Please try again.'),
				indicator: 'red',
			});
			console.error(error);
		}
	}


	async update_item_field(value, field_or_action) {

		if (field_or_action === "checkout") {
			this.item_details.toggle_item_details_section(null);
			
		} else if (field_or_action === "remove") {
			this.remove_item_from_cart();
		} else {
			const field_control = this.item_details[`${field_or_action}_control`];
			if (!field_control) return;
			field_control.set_focus();
			value != "" && field_control.set_value(value);
		}
	}

	// remove_item_from_cart() {	
	// 	frappe.dom.freeze();
	// 	const { doctype, name, current_item } = this.item_details;

	// 	return frappe.model
	// 		.set_value(doctype, name, "qty", 0)
	// 		.then(() => {
	// 			frappe.model.clear_doc(doctype, name);
	// 			this.update_cart_html(current_item, true);
	// 			this.item_details.toggle_item_details_section(null);
	// 			frappe.dom.unfreeze();
	// 		})
	// 	.catch((e) => console.log(e));
	// }

	

	// remove_item_from_cart() {

	// 	//Authenticate OIC to Remove
	// 	const passwordDialog = new frappe.ui.Dialog({
	// 		title: __('Enter OIC Password'),
	// 		fields: [
	// 			{
	// 				fieldname: 'password',
	// 				fieldtype: 'Password',
	// 				label: __('Password'),
	// 				reqd: 1
	// 			}
	// 		],
	// 		primary_action_label: __('Remove'),
	// 		primary_action: (values) => {
	// 			let password = values.password;
	// 			let role = "oic";
	
	// 			frappe.call({
	// 				method: "custom_app.customapp.page.packing_list.packing_list.confirm_user_password",
	// 				args: { password: password, role: role },
	// 				callback: (r) => {
	// 					if (r.message) {
	// 						// Password authenticated, proceed with item removal
	// 						frappe.dom.freeze();
	// 						const { doctype, name, current_item } = this.item_details;
	
	// 						frappe.model
	// 							.set_value(doctype, name, "qty", 0)
	// 							.then(() => {
	// 								frappe.model.clear_doc(doctype, name);
	// 								this.update_cart_html(current_item, true);
	// 								this.item_details.toggle_item_details_section(null);
	// 								frappe.dom.unfreeze();
	// 								passwordDialog.hide();
	// 							})
	// 							.catch((e) => {
	// 								console.log(e);
	// 								frappe.dom.unfreeze();
	// 								passwordDialog.hide();
	// 							});
	// 					} else {
	// 						frappe.show_alert({
	// 							message: __('Incorrect password or user is not an OIC'),
	// 							indicator: 'red'
	// 						});
	// 					}
	// 				}
	// 			});
	// 		}
	// 	});
	// 	passwordDialog.show();
	// }



	remove_item_from_cart() {
		// Destroy any previous instances of the dialog
		if (this.passwordDialog) {
			this.passwordDialog.$wrapper.remove();
			delete this.passwordDialog;
		}
	
		// Create and show the password dialog
		this.passwordDialog = new frappe.ui.Dialog({
			title: __('Enter OIC Password'),
			fields: [
				{
					fieldtype: 'HTML',
					fieldname: 'password_html',
					options: `
						<div class="form-group">
							<label for="password_field">${__('Password')}</label>
							<input type="password" id="password_field" class="form-control" required>
						</div>
					`
				}
			],
			primary_action_label: __('Ok'),
			primary_action: () => {
				// Retrieve the password value from the HTML field
				let password = document.getElementById('password_field').value;
	
				frappe.call({
					method: "custom_app.customapp.page.packing_list.packing_list.confirm_user_password",
					args: { password: password },
					callback: (r) => {
						if (r.message) {
							if (r.message.name) {
								frappe.dom.freeze();
								const { doctype, name, current_item } = this.item_details;
	
								frappe.model
									.set_value(doctype, name, "qty", 0)
									.then(() => {
										frappe.model.clear_doc(doctype, name);
										this.update_cart_html(current_item, true);
										this.item_details.toggle_item_details_section(null);
										frappe.dom.unfreeze();
										this.passwordDialog.hide();
									})
									.catch((e) => {
										console.log(e);
										frappe.dom.unfreeze();
										this.passwordDialog.hide();
									});
							} else {
								frappe.show_alert({
									message: ('Incorrect password'),
									indicator: 'red'
								});
							}
						} else {
							frappe.show_alert({
								message: ('Incorrect password'),
								indicator: 'red'
							});
						}
					}
				});
			}
		});
	
		this.passwordDialog.show();
	
		// Ensure the password field gains focus every time the dialog is opened
		this.passwordDialog.$wrapper.on('shown.bs.modal', function () {
			setTimeout(() => {
				document.getElementById('password_field').focus();
			}, 100); // Slight delay to ensure field is rendered before focusing
		});
	}
	

	// remove_item_from_cart() {

	// 	//Authenticate OIC to Remove
	// 	const passwordDialog = new frappe.ui.Dialog({
	// 		title: __('Enter OIC Password'),
	// 		fields: [
	// 			{
	// 				fieldname: 'password',
	// 				fieldtype: 'Password',
	// 				label: __('Password'),
	// 				reqd: 1
	// 			}
	// 		],
	// 		primary_action_label: __('Ok'),
	// 		primary_action: (values) => {
    //             let password = values.password;
    //             frappe.call({
    //                 method: "custom_app.customapp.page.packing_list.packing_list.confirm_user_password",
    //                 args: { password: password },
    //                 callback: (r) => {
    //                     if (r.message) {
    //                         if(r.message.name) {
    //                             this.set_pharmacist_assist(this.frm, r.message.name)
	// 							console.log(this.frm, r.message.name)
    //                             this.frm
    //                                 .save(undefined, undefined, undefined, () => {
    //                                     frappe.show_alert({
    //                                         message: ("There was an error saving the document."),
    //                                         indicator: "red",
    //                                     });
    //                                     frappe.utils.play_sound("error");
    //                                 })
    //                                 .then(() => {
	// 									frappe.dom.freeze();
	// 									const { doctype, name, current_item } = this.item_details;
				
	// 									frappe.model
	// 										.set_value(doctype, name, "qty", 0)
	// 										.then(() => {
	// 											frappe.model.clear_doc(doctype, name);
	// 											this.update_cart_html(current_item, true);
	// 											this.item_details.toggle_item_details_section(null);
	// 											frappe.dom.unfreeze();
	// 											passwordDialog.hide();
	// 										})
	// 										.catch((e) => {
	// 											console.log(e);
	// 											frappe.dom.unfreeze();
	// 											passwordDialog.hide();
	// 										});
    //                                 });
    //                         }else{
    //                             frappe.show_alert({
    //                                 message: ('Incorrect password'),
    //                                 indicator: 'red'
    //                             });
    //                         }
    //                     } else {
    //                         frappe.show_alert({
    //                             message: ('Incorrect password'),
    //                             indicator: 'red'
    //                         });
    //                     }
    //                 }
    //             });
    //         }
	// 	})
	// 	passwordDialog.show();
	// }


	async save_and_checkout() {
		if (this.frm.is_dirty()) {
			let save_error = false;
			// await this.frm.save(null, null, null, () => (save_error = true));
			// only move to payment section if save is successful
			!save_error && this.payment.checkout();
			// show checkout button on error
			save_error &&
				setTimeout(() => {
					this.cart.toggle_checkout_btn(true);
				}, 300); // wait for save to finish
		} else {
			this.payment.checkout();
		}
	}
};
