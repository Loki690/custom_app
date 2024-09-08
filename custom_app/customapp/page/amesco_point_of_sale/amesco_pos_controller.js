custom_app.PointOfSale.Controller = class {
	constructor(wrapper) {
		this.wrapper = $(wrapper).find(".layout-main-section");
		this.page = wrapper.page;

		this.check_opening_entry();
	}

	fetch_opening_entry() {
		return frappe.call("custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.check_opening_entry", {
			user: frappe.session.user,
		});
	}

	check_opening_entry() {
		this.fetch_opening_entry().then((r) => {
			if (r.message.length) {
				// assuming only one opening voucher is available for the current user
				this.prepare_app_defaults(r.message[0]);
			} else {
				this.create_opening_voucher();
			}
		});
	}


	// Example JavaScript code to make the API call


	create_opening_voucher() {
		const me = this;
		const table_fields = [
			{
				fieldname: "mode_of_payment",
				fieldtype: "Link",
				in_list_view: 1,
				label: "Mode of Payment",
				options: "Mode of Payment",
				reqd: 1,
			},
			{
				fieldname: "opening_amount",
				fieldtype: "Currency",
				in_list_view: 1,
				label: "Opening Amount",
				options: "company:company_currency",
				change: function () {
					dialog.fields_dict.balance_details.df.data.some((d) => {
						if (d.idx == this.doc.idx) {
							d.opening_amount = this.value;
							dialog.fields_dict.balance_details.grid.refresh();
							return true;
						}
					});
				},
			},
		];
		const fetch_pos_payment_methods = () => {
			const pos_profile = dialog.fields_dict.pos_profile.get_value();
			if (!pos_profile) return;

			frappe.db.get_doc("POS Profile", pos_profile).then(({ payments }) => {
				dialog.fields_dict.balance_details.df.data = [];

				payments.forEach((pay) => {
					const { mode_of_payment } = pay;

					// Only include "Cash" payment method
					if (mode_of_payment === "Cash") {
						const opening_amount = "1500";
						dialog.fields_dict.balance_details.df.data.push({ mode_of_payment, opening_amount });
					}
				});

				dialog.fields_dict.balance_details.grid.refresh();
			});
		};


		const get_next_shift = async (pos_profile) => {
			const res = await frappe.call({
				method: 'custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.get_shift_count',
				args: { pos_profile }
			});

			// Second Frappe call to get the max_shift value from the POS Profile
			const max_shift_response = await frappe.call({
				method: 'custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.get_pos_profile_shift',
				args: { pos_profile }
			});

			const max_shift = max_shift_response.message; // Adjust 'max_shift' to the actual field name

			if (res.message >= max_shift) {
				frappe.msgprint(__('You have already reached the maximum of shifts for todays opening'));
				frappe.utils.play_sound("error");
				throw new Error('Max shifts reached');
			}
			return `Shift ${res.message + 1}`;
		};

		const dialog = new frappe.ui.Dialog({
			title: __("Create POS Opening Entry"),
			static: true,
			fields: [
				{
					fieldtype: "Link",
					label: __("Company"),
					default: frappe.defaults.get_default("company"),
					options: "Company",
					fieldname: "company",
					reqd: 1,
				},
				{
					fieldtype: "Link",
					label: __("POS Profile"),
					options: "POS Profile",
					fieldname: "pos_profile",
					reqd: 1,
					get_query: () => pos_profile_query(),
					onchange: () => fetch_pos_payment_methods(),
				},
				{
					fieldname: "balance_details",
					fieldtype: "Table",
					label: "Opening Balance Details",
					cannot_add_rows: false,
					in_place_edit: true,
					reqd: 1,
					data: [],
					fields: table_fields,
				},
			],
			primary_action: async function ({ company, pos_profile, balance_details }) {
				try {
					const custom_shift = await get_next_shift(pos_profile);

					// Validate balance details
					if (!balance_details.length) {
						frappe.show_alert({
							message: __("Please add Mode of payments and opening balance details."),
							indicator: "red",
						});
						return frappe.utils.play_sound("error");
					}

					// Filter balance details
					balance_details = balance_details.filter((d) => d.mode_of_payment);

					// Call the custom method to create the opening voucher
					const method = "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.create_opening_voucher";
					const res = await frappe.call({
						method,
						args: { pos_profile, company, balance_details, custom_shift },
						freeze: true,
					});

					if (!res.exc) {
						me.prepare_app_defaults(res.message);
					}

					dialog.hide();
				} catch (error) {
					console.error("Error creating POS Opening Entry:", error);
				}
			},
			primary_action_label: __("Submit"),
		});
		dialog.show();
		const pos_profile_query = () => {
			return {
				query: "erpnext.accounts.doctype.pos_profile.pos_profile.pos_profile_query",
				filters: { company: dialog.fields_dict.company.get_value() },
			};
		};
	}

	async prepare_app_defaults(data) {
		this.pos_opening = data.name;
		this.company = data.company;
		this.pos_profile = data.pos_profile;
		this.pos_opening_time = data.period_start_date;
		this.item_stock_map = {};
		this.settings = {};

		// console.log('this.setting:', this.settings)

		frappe.db.get_value("Stock Settings", undefined, "allow_negative_stock").then(({ message }) => {
			this.allow_negative_stock = flt(message.allow_negative_stock) || false;
		});

		frappe.call({
			method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.get_pos_profile_data",
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



	//Customized Layout For Cashier
	make_app() {
		this.prepare_dom();
		this.prepare_components();
		this.toggle_recent_order_list(true);
		this.add_buttons_to_toolbar();
		this.prepare_menu();
		this.make_new_invoice();



	}
	//Customized Layout For Cashier
	prepare_dom() {
		this.wrapper.append(`<div class="point-of-sale-app"></div>`);

		this.$components_wrapper = this.wrapper.find(".point-of-sale-app");
	}
	//Customized Layout For Cashier
	prepare_components() {
		this.init_recent_order_list();
		this.init_order_summary();
		this.init_item_selector();
		this.init_item_details();
		this.init_item_cart();
		this.init_payments();

	}

	prepare_menu() {
		this.page.clear_menu();

		// this.page.add_menu_item(__("Open Form View"), this.open_form_view.bind(this), false, "Ctrl+F");
		this.page.add_menu_item(__("Item Selector (F1)"), this.add_new_order.bind(this), false, "f1");
		this.page.add_menu_item(
			__("Pending Transaction (F2)"),
			this.order_list.bind(this),
			false,
			"f2"
		);

		this.page.add_menu_item(__("Save as Draft"), this.save_draft_invoice.bind(this), false, "f3");

		// this.page.add_menu_item(__("Cash Count"), this.cash_count.bind(this), false, "f4");

		this.page.add_menu_item(__("Check Encashment"), this.check_encashment.bind(this), false, "f6");
		this.page.add_menu_item(__('Z Reading (BIR)'), this.z_reading.bind(this), false, "f5");
		this.page.add_menu_item(__('DSRS'), this.dsrs_reading.bind(this), false, "f0");
		this.page.add_menu_item(__("Close the POS(X Reading)"), this.close_pos.bind(this), false, "Shift+Ctrl+C");
	}


	add_buttons_to_toolbar() {
		const buttons = [

			{label: __("Item Selector (F1)"), action: this.add_new_order.bind(this), shortcut: "f1"},
			{label: __("Pending Transaction (F2)"), action: this.order_list.bind(this), shortcut: "f2"},
			{label: __("Save as Draft (F3)"), action: this.save_draft_invoice.bind(this), shortcut: "f3"},
			{ label: __("Amesco Plus Member"), action: this.amesco_plus_scan.bind(this), shortcut: "f4" },
			// {label: __("Cash Count"), action: this.cash_count.bind(this), shortcut: "Ctrl+B"},
			// {label: __("Cash Voucher"), action: this.cash_voucher.bind(this), shortcut: "Ctrl+X"},
			{label: __("Close the POS(X Reading)"), action: this.close_pos.bind(this), shortcut: "Shift+Ctrl+C"}

		];

		// Clear existing buttons to avoid duplication
		$('.page-actions .btn-custom').remove();

		buttons.forEach(btn => {
			this.page.add_button(btn.label, btn.action, { shortcut: btn.shortcut }).addClass('btn-custom');
		});
	}

	showPasswordDialog(title, onSuccess) {
		const passwordDialog = new frappe.ui.Dialog({
			title: __(title),
			fields: [
				{
					fieldname: 'password',
					fieldtype: 'Password',
					label: __('Password'),
					reqd: 1
				}
			],
			primary_action_label: __('Authorize'),
			primary_action: (values) => {
				let password = values.password;
				frappe.call({
					method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.confirm_user_password",
					args: { password: password},
					callback: (r) => {
						if (r.message.name) {
							frappe.show_alert({
								message: __('Verified'),
								indicator: 'green'
							});
							passwordDialog.hide();
							onSuccess();
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

		passwordDialog.show();
	}

	z_reading() {
		const onSuccess = () => {
			if (!this.$components_wrapper.is(":visible")) return;
			frappe.db.get_doc('POS Profile', this.frm.doc.pos_profile)
			.then(pos_profile => {
				let voucher = frappe.model.get_new_doc("POS Z Reading");
				voucher.pos_profile = this.frm.doc.pos_profile;
				voucher.date_from = pos_profile.custom_start_operating_date;
				voucher.date_to = frappe.datetime.now_datetime();
				frappe.set_route("Form", "POS Z Reading", voucher.name);
			})
			.catch(error => {
				console.error("Error fetching POS Profile:", error);
				frappe.msgprint(__('Failed to fetch POS Profile. Please try again.'));
			});
		};

		this.showPasswordDialog('OIC Authorization Required for Z Reading', onSuccess);
	}

	dsrs_reading() {
		const onSuccess = () => {
			if (!this.$components_wrapper.is(":visible")) return;
			let voucher = frappe.model.get_new_doc("POS Daily Sales Report Summary");
			voucher.pos_profile = this.frm.doc.pos_profile;
			voucher.custom_date_created = frappe.datetime.now_datetime();
			frappe.set_route("Form", "POS Daily Sales Report Summary", voucher.name);
		};

		this.showPasswordDialog('OIC Authorization Required for DSRS', onSuccess);
	}

	//Cash Voucher
	cash_voucher() {
		if (!this.$components_wrapper.is(":visible")) return;
		let voucher = frappe.model.get_new_doc("Cash Voucher Entry");
		voucher.custom_pos_profile = this.frm.doc.pos_profile;
		voucher.custom_cashier = frappe.session.user;
		voucher.custom_opening_entry = this.pos_opening;
		frappe.set_route("Form", "Cash Voucher Entry", voucher.name);
	}


	//Check Encashment
	check_encashment() {

		const onSuccess = () => {
			if (!this.$components_wrapper.is(":visible")) return;

				let voucher = frappe.model.get_new_doc("Check Encashment Entry")
				voucher.custom_pos_profile = this.frm.doc.pos_profile;
				voucher.custom_received_by = frappe.session.user;
				voucher.custom_opening_entry = this.pos_opening;
				frappe.set_route("Form", "Check Encashment Entry", voucher.name)
		
			.catch(error => {
				console.error("Error fetching POS Profile:", error);
				frappe.msgprint(__('Failed to fetch POS Profile. Please try again.'));
			});
		};
		this.showPasswordDialog('OIC Authorization Required for Check Encashment Entry', onSuccess);
	}

	add_new_order() {
		frappe.run_serially([
			() => frappe.dom.freeze(),
			() => this.frm.call("reset_mode_of_payments"),
			() => this.cart.load_invoice(),
			() => this.remove_pos_cart_items(),
			() => this.make_new_invoice(),
			() => this.item_selector.toggle_component(),
			() => this.item_details.toggle_item_details_section(),
			() => this.toggle_recent_order_list(false),
			() => frappe.dom.unfreeze(),
			// () => this.item_selector.refresh(),
		]);
	}


	remove_pos_cart_items() {
		// console.log('Remove cart items')
		localStorage.removeItem('posCartItems');
	}

	order_list() {
		frappe.run_serially([
			() => frappe.dom.freeze(),
			() => this.frm.call("reset_mode_of_payments"),
			() => this.cart.load_invoice(),
			() => this.make_new_invoice(),
			() => this.item_selector.toggle_component(true),
			() => this.item_details.toggle_item_details_section(),
			() => this.toggle_recent_order_list(true),
			() => window.location.reload(),
			() => frappe.dom.unfreeze(),

		]);
	}

	amesco_plus_scan() {

		const me = this
		const doc = me.frm
		
		new frappe.ui.Scanner({
			dialog: true, // open camera scanner in a dialog
			multiple: false, // stop after scanning one value
			on_scan(data) {
				// Assuming the scanned data is comma-separated
				let scannedData = data.decodedText.split(',');
				// Extracting fields from the scanned data
				let user_id = scannedData[0];
				let userName = scannedData[2];
				let email = scannedData[3];
				let points = scannedData[4];

				doc.set_value('custom_ameso_user', email);
				doc.set_value('custom_amesco_user_id', user_id);

				// Creating a dialog to display the extracted data
				let userDetailsDialog = new frappe.ui.Dialog({
					title: __('Scanned User Details'),
					fields: [
						{
							label: 'Name',
							fieldname: 'user_name',
							fieldtype: 'Data',
							read_only: 1,
							default: userName
						},
						{
							label: 'Email',
							fieldname: 'email',
							fieldtype: 'Data',
							read_only: 1,
							default: email
						},
						{
							label: 'Points',
							fieldname: 'points',
							fieldtype: 'Data',
							read_only: 1,
							default: points
						}
					],
					primary_action_label: __('Close'),
					primary_action: function() {
						userDetailsDialog.hide();
					}
				});
	
				// Show the dialog with user details
				userDetailsDialog.show();
			}
		})
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





	open_form_view() {
		frappe.model.sync(this.frm.doc);
		frappe.set_route("Form", this.frm.doc.doctype, this.frm.doc.name);
	}

	toggle_recent_order() {
		const show = this.recent_order_list.$component.is(":hidden");
		this.toggle_recent_order_list(show);
		this.payment.toggle_component(false);
		this.item_details.toggle_component(false); /// Add to fix ui hide payment is Order list toggled in Menu
	}

	save_draft_invoice() {
		if (!this.$components_wrapper.is(":visible")) return;

		if (this.frm.doc.items.length == 0) {
			frappe.show_alert({
				message: __("You must add atleast one item to save it as draft."),
				indicator: "red",
			});
			frappe.utils.play_sound("error");
			return;
		}

		this.frm
			.save(undefined, undefined, undefined, () => {
				frappe.show_alert({
					message: __("There was an error saving the document."),
					indicator: "red",
				});
				frappe.utils.play_sound("error");
			})
			.then(() => {
				frappe.run_serially([
					() => this.toggle_recent_order_list(show),
				]);
			});
	}


	save_draft() {
		if (!this.$components_wrapper.is(":visible")) return;

		if (this.frm.doc.items.length == 0) {
			frappe.show_alert({
				message: __("You must add atleast one item to complete the order."),
				indicator: "red",
			});
			frappe.utils.play_sound("error");
			return;
		}

		const passwordDialog = new frappe.ui.Dialog({
			title: __('Enter Your Password'),
			fields: [
				{
					fieldname: 'password',
					fieldtype: 'Password',
					label: __('Password'),
					reqd: 1
				}
			],
			primary_action_label: __('Ok'),
			primary_action: (values) => {
				let password = values.password;
				frappe.call({
					method: "custom_app.customapp.page.packing_list.packing_list.get_user_details_by_password",
					args: { password: password },
					callback: (r) => {
						if (r.message.name) {
							this.set_pharmacist_assist(this.frm, r.message.name)
							this.frm
								.save(undefined, undefined, undefined, () => {
									frappe.show_alert({
										message: __("There was an error saving the document."),
										indicator: "red",
									});
									frappe.utils.play_sound("error");
								})
								.then(() => {
									frappe.run_serially([
										() => frappe.dom.freeze(),
										() => this.make_new_invoice(),
										() => frappe.dom.unfreeze(),
										
									]);

									passwordDialog.hide();
									localStorage.removeItem('posCartItems'); // remove stored data from local storage
								});

						} else {
							frappe.show_alert({
								message: `${r.message.error}`,
								indicator: 'red'
							});
						}
					}
				});
			}
		})
		passwordDialog.show();
	}

	close_pos() {

		const me = this;
		// Show password dialog for OIC authentication
		const passwordDialog = new frappe.ui.Dialog({
			title: __('Authorization Required OIC'),
			fields: [
				{
					fieldname: 'password',
					fieldtype: 'Password',
					label: __('Password'),
					reqd: 1
				}
			],
			// size: 'small',
			primary_action_label: __('Authorize'),
			primary_action: (values) => {
				let password = values.password;

				frappe.call({
					method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.confirm_user_password",
					args: { password: password },
					callback: (r) => {
						if (!r.message.error) {
							// Password is correct and user has the allowed roles
							frappe.show_alert({
								message: __('Verified'),
								indicator: 'green'
							});
				
							passwordDialog.hide();
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
						} else {
							// Show alert for incorrect password or unauthorized user
							frappe.show_alert({
								message: __('Incorrect password or user'),
								indicator: 'red'
							});
						}
					}
				});
				
			}
		});

		passwordDialog.show();


	}

	cash_count() {
		if (!this.$components_wrapper.is(":visible")) return;
		let voucher = frappe.model.get_new_doc("Cash Count Denomination Entry");
		voucher.custom_pos_profile = this.frm.doc.pos_profile;
		voucher.user = frappe.session.user;
		voucher.custom_pos_opening_entry_id = this.pos_opening;
		frappe.set_route("Form", "Cash Count Denomination Entry", voucher.name);
	}

	init_item_selector() {
		this.selected_uom = "PC";
		this.item_selector = new custom_app.PointOfSale.ItemSelector({
			wrapper: this.$components_wrapper,
			pos_profile: this.pos_profile,
			settings: this.settings,
			events: {
				item_selected: (args) => {
					// Fetch the warehouse from POS Profile
					frappe.call({
						method: 'custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.get_pos_warehouse',
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

				cart_item_clicked: (item) => {
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
						const item_to_clone2 = this.frm.doc.items.find((i) => i.latest_expiry_date == item.latest_expiry_date);
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
					// Calculate the total payment amount
					let payment_amount = this.frm.doc.payments.reduce((sum, payment) => sum + payment.amount, 0);

					// Check if payment is sufficient
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

					// Proceed with submitting the invoice if payment is sufficient
					let errorOccurred = false; // Flag to track if an error occurred

					this.frm.save('Submit', undefined, undefined, () => {
						// Error handling during save
						frappe.show_alert({
							message: __("There was an error saving the document."),
							indicator: "red",
						});
						frappe.utils.play_sound("error"); 
						errorOccurred = true; // Set error flag
					}).then(() => {
						if (errorOccurred) return; // Skip further actions if an error occurred

						this.toggle_components(false);
						// Customized Layout to toggle off Cart
						this.cart.toggle_component(false);
						this.order_summary.toggle_component(false);
						this.remove_pos_cart_items();
						this.order_summary.load_summary_of(this.frm.doc, true);
						this.order_summary.print_receipt();


						// Calculate the change
						let change_amount = payment_amount - this.frm.doc.grand_total;

						// Show change in a dialog
						const changeDialog = new frappe.ui.Dialog({
							title: __('Change Amount'),
							primary_action_label: __('OK (Press Enter)'),
							primary_action: () => {
								window.location.reload();
								changeDialog.hide();
							},
						

						});

						// Add custom HTML with large text for the change amount
						changeDialog.body.innerHTML = `
							<div style="text-align: center; font-size: 60px; margin: 20px 0;">
								${format_currency(change_amount)}
							</div>
						`;

						changeDialog.show();

						$(document).on('keydown', function(e) {
							if (e.key === 'Enter') {
								// Trigger primary action (OK button) on Enter key press
								e.preventDefault();
								changeDialog.primary_action();
							} 
						});
						
					});
				}

			},
		});
	}

	init_recent_order_list() {
		this.recent_order_list = new custom_app.PointOfSale.PastOrderList({
			wrapper: this.$components_wrapper,
			events: {

				get_frm: () => this.frm,

				open_invoice_data: (name) => {
					frappe.db.get_doc("POS Invoice", name).then((doc) => {
						this.order_summary.load_summary_of(doc);
					});
				},

				// return pos profile
				pos_profile: () => {
					return this.pos_profile;
				},

				source_warehouse: () => {
					return this.settings.warehouse;
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
					this.oic_delete_confirm(name)
				},

				new_order: () => {

					frappe.run_serially([
						() => frappe.dom.freeze(),
						() => this.make_new_invoice(),
						() => this.cart.load_invoice(),
						() => this.item_selector.toggle_component(true),
						() => frappe.dom.unfreeze(),
					]);
				},

				proceed_order: (name) => {
					this.recent_order_list.toggle_component(false);
					frappe.run_serially([

						() => this.frm.refresh(name),
						() => this.cart.load_invoice(),
						() => this.item_selector.toggle_component(true),
						() => this.save_and_checkout(true),
						() => this.cart.toggle_checkout_btn(false),

					]);
				},


				order_list: () => {

					frappe.run_serially([
						() => frappe.dom.freeze(),
						() => this.item_selector.toggle_component(false),
						() => this.toggle_recent_order_list(true),
						() => frappe.dom.unfreeze(),
					]);

				},


			},
		});
	}



	// oic_edit_confirm(name) {
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
	// 		primary_action_label: __('Edit Order'),
	// 		primary_action: (values) => {
	// 			let password = values.password;
	// 			let role = "oic";

	// 			frappe.call({
	// 				method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.confirm_user_password",
	// 				args: { password: password, role: role },
	// 				callback: (r) => {
	// 					if (r.message) {
	// 						this.recent_order_list.toggle_component(false);
	// 						frappe.run_serially([
	// 							() => this.frm.refresh(name),
	// 							() => this.cart.load_invoice(),
	// 							() => this.item_selector.toggle_component(true),
	// 							() => this.toggle_recent_order_list(false), // Toggle false order list to remove order summary
	// 						]);
	// 						passwordDialog.hide();
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
	// 	this.toggle_components(true); //Toggle True so order summary stays while authentication modal is activated
	// }




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
									() => this.item_selector.load_items_data(), 
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

	oic_delete_confirm(name) {
		const passwordDialog = new frappe.ui.Dialog({
			title: __('Enter OIC Password'),
			fields: [
				{
					fieldname: 'password',
					fieldtype: 'Password',
					label: __('Password'),
					reqd: 1
				}
			],
			primary_action_label: __('Authenticate'),
			primary_action: (values) => {
				let password = values.password;
				let role = "oic";

				frappe.call({
					method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.confirm_user_password",
					args: { password: password, role: role },
					callback: (r) => {
						if (r.message) {
							// Password authenticated, proceed with order deletion
							frappe.model.delete_doc(this.frm.doc.doctype, name, () => {
								this.recent_order_list.refresh_list();
								this.recent_order_list.toggle_component(true);
								passwordDialog.hide();
							});
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

		passwordDialog.show();
	}




	toggle_recent_order_list(show) {
		// Toggle recent order list component
		this.recent_order_list.toggle_component(show);

		// Toggle order summary component
		this.order_summary.toggle_component(show);

		// Toggle item cart component
		this.cart.toggle_component(!show);
		this.item_selector.toggle_component(!show);

		// Hide item details and payment if recent order is toggled off
		!show ? this.item_details.toggle_component(false) || this.payment.toggle_component(false) : "";
	}

	toggle_components(show) {
		this.cart.toggle_component(!show);
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
			() => this.cart.load_invoice(), // Load the invoice first
			() => frappe.dom.unfreeze(),
			() => this.cart.toggle_component(false) // Hide the cart component after loading the invoice
		]);
	}

	make_sales_invoice_frm() {
		const doctype = "POS Invoice";
		return new Promise((resolve) => {
			if (this.frm) {
				this.frm = this.get_new_frm(this.frm);
				this.frm.doc.items = [];
				this.frm.doc.is_pos = 1;
				resolve();
			} else {
				frappe.model.with_doctype(doctype, () => {
					this.frm = this.get_new_frm();
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
			method: "erpnext.accounts.doctype.pos_invoice.pos_invoice.make_sales_return",
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

				if (this.item_details.$component.is(":visible")) this.edit_item_details_of(item_row);

				if (
					this.check_serial_batch_selection_needed(item_row) &&
					!this.item_details.$component.is(":visible")
				)
					this.edit_item_details_of(item_row);
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

	update_item_field(value, field_or_action) {
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
	// 				method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.confirm_user_password",
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

		const passwordDialog = new frappe.ui.Dialog({
			title: __('Enter OIC Password'),
			fields: [
				{
					fieldname: 'password',
					fieldtype: 'Password',
					label: __('Password'),
					reqd: 1
				}
			],
			primary_action_label: __('Ok'),
			primary_action: (values) => {

                let password = values.password;
                frappe.call({
					method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.confirm_user_password",
                    args: { password: password },
                    callback: (r) => {
                        if (r.message) {
                            if(r.message.name) {
								frappe.dom.freeze();
								const { doctype, name, current_item } = this.item_details;
		
								frappe.model
									.set_value(doctype, name, "qty", 0)
									.then(() => {
										frappe.model.clear_doc(doctype, name);
										this.update_cart_html(current_item, true);
										this.item_details.toggle_item_details_section(null);
										frappe.dom.unfreeze();
										passwordDialog.hide();
									})
									.catch((e) => {
										console.log(e);
										frappe.dom.unfreeze();
										passwordDialog.hide();
									});
                            }else{
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
		})
		passwordDialog.show();
	}


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
