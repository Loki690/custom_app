custom_app.PointOfSale.ItemCart = class {
	constructor({ wrapper, events, settings }) {
		this.wrapper = wrapper;
		this.events = events;
		this.customer_info = undefined;
		this.hide_images = settings.hide_images;
		this.allowed_customer_groups = settings.customer_groups;
		this.allowed_doctor_groups = settings.doctor_groups;
		this.allow_rate_change = settings.allow_rate_change;
		this.allow_discount_change = settings.allow_discount_change;
		this.init_component();
	}

	init_component() {
		this.prepare_dom();
		this.init_child_components();
		this.bind_events();
		this.attach_shortcuts();
	} 

	prepare_dom() {
		this.wrapper.append(`<section class="customer-cart-container" style="margin-top:-1rem; grid-column: span 6/ span 6;"></section>`);

		this.$component = this.wrapper.find(".customer-cart-container");
	}


	init_child_components() {
		this.init_customer_selector();
		this.init_doctor_selector();
		this.init_cart_components();
	}

	init_customer_selector() {
		this.$component.append(`<div class="customer-section mb-2 mt-4"></div>`);

		this.$customer_section = this.$component.find(".customer-section");
		this.make_customer_selector();
	}


	init_doctor_selector() {
		this.$component.append(`<div class="doctor-section" style="display: flex;
		flex-direction: column;
		padding: var(--padding-md) var(--padding-lg);
		overflow: visible; background-color: var(--fg-color);
		box-shadow: var(--shadow-base);
		border-radius: var(--border-radius-md);
	  }; margin-top: 1em;"></div>`);
		this.$doctor_section = this.$component.find(".doctor-section");
		this.make_doctor_selector();
	}


	reset_customer_selector() {
		const frm = this.events.get_frm();
		frm.set_value("customer", "");
		this.make_customer_selector();
		this.customer_field.set_focus();
	}

	reset_doctor_selector() {
		const frm = this.events.get_frm();
		frm.set_value("doctor", "");
		this.make_doctor_selector();
		this.doctor_field.set_focus();
	}

	init_cart_components() {
		this.$component.append(
			`<div class="cart-container">
				<div class="abs-cart-container">
					<div class="cart-label" >${__("Item Cart")}</div>
					<div class="cart-header">
						<div class="name-header">${__("Item")}</div>
						<div class="qty-header">${__("Vat Type")}</div>
						<div class="qty-header">${__("Price")}</div>
						<div class="qty-header" >${__("Disc %")}</div>
						<div class="qty-header">${__("Quantity")}</div>
						
						<div class="rate-amount-header">${__("Amount")}</div>
					</div>
					<div class="cart-items-section"></div>
					<div class="cart-totals-section"></div>
					<div class="numpad-section"></div>
				</div>
			</div>`
		);
		this.$cart_container = this.$component.find(".cart-container");

		this.make_cart_totals_section();
		this.make_cart_items_section();
		this.make_cart_numpad();
	}

	make_cart_items_section() {
		this.$cart_header = this.$component.find(".cart-header");
		this.$cart_items_wrapper = this.$component.find(".cart-items-section");
		//this.load_stored_cart_items();
		this.make_no_items_placeholder();
	}

	make_no_items_placeholder() {
		this.$cart_header.css("display", "none");
		this.$cart_items_wrapper.html(`<div class="no-item-wrapper">${__("No items in cart")}</div>`);
	}


	add_keyboard_navigation() {
		this.$component.on('keydown', '[tabindex="0"]', (e) => {
			if (e.key === 'Enter') {
				$(e.target).trigger('click');
			}
			switch (e.key) {
				case 'ArrowUp':
					e.preventDefault();
					this.focusPreviousElement(e.target);
					break;
				case 'ArrowDown':
					e.preventDefault();
					this.focusNextElement(e.target);
					break;
			}
		});
	}

	focusNextElement(current) {
		let $next = $(current).nextAll('[tabindex="0"]').first();
		if (!$next.length) {
			$next = this.$component.find('[tabindex="0"]').first();
		}
		$next.focus();
	}

	focusPreviousElement(current) {
		let $prev = $(current).prevAll('[tabindex="0"]').first();
		if (!$prev.length) {
			$prev = this.$component.find('[tabindex="0"]').last();
		}
		$prev.focus();
	}

	get_cart_item(item_data) {
		return this.$cart_items_wrapper.find(`[data-row-name="${escape(item_data.name)}"]`);
	}


	get_discount_icon() {
		return `<svg class="discount-icon" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M19 15.6213C19 15.2235 19.158 14.842 19.4393 14.5607L20.9393 13.0607C21.5251 12.4749 21.5251 11.5251 20.9393 10.9393L19.4393 9.43934C19.158 9.15804 19 8.7765 19 8.37868V6.5C19 5.67157 18.3284 5 17.5 5H15.6213C15.2235 5 14.842 4.84196 14.5607 4.56066L13.0607 3.06066C12.4749 2.47487 11.5251 2.47487 10.9393 3.06066L9.43934 4.56066C9.15804 4.84196 8.7765 5 8.37868 5H6.5C5.67157 5 5 5.67157 5 6.5V8.37868C5 8.7765 4.84196 9.15804 4.56066 9.43934L3.06066 10.9393C2.47487 11.5251 2.47487 12.4749 3.06066 13.0607L4.56066 14.5607C4.84196 14.842 5 15.2235 5 15.6213V17.5C5 18.3284 5.67157 19 6.5 19H8.37868C8.7765 19 9.15804 19.158 9.43934 19.4393L10.9393 20.9393C11.5251 21.5251 12.4749 21.5251 13.0607 20.9393L14.5607 19.4393C14.842 19.158 15.2235 19 15.6213 19H17.5C18.3284 19 19 18.3284 19 17.5V15.6213Z" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M15 9L9 15" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M10.5 9.5C10.5 10.0523 10.0523 10.5 9.5 10.5C8.94772 10.5 8.5 10.0523 8.5 9.5C8.5 8.94772 8.94772 8.5 9.5 8.5C10.0523 8.5 10.5 8.94772 10.5 9.5Z" fill="white" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M15.5 14.5C15.5 15.0523 15.0523 15.5 14.5 15.5C13.9477 15.5 13.5 15.0523 13.5 14.5C13.5 13.9477 13.9477 13.5 14.5 13.5C15.0523 13.5 15.5 13.9477 15.5 14.5Z" fill="white" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`;
	}

	make_cart_totals_section() {
		this.$totals_section = this.$component.find(".cart-totals-section");

		this.$totals_section.append(
			`
			<div class="item-qty-total-container">
				<div class="item-qty-total-label">${__("Total Items")}</div>
				<div class="item-qty-total-value">0.00</div>
			</div>
			<div class="vatable-sales-container"></div>
			<div class="vat-exempt-container"></div>
			<div class="zero-rated-container"></div>
			
			
			<div class="ex-total-container"></div>
				<div class="net-total-container" style="line-height: 0rem; font-size:12px;">
				<div class="net-total-label">${__("Sub Total:")}</div>
				<div class="net-total-value" style="font-size:12px;">0.00</div>
			</div>

		 <div class="taxes-container"></div>
		 <div class="vat-container"></div>
		<div class="total-vat-container"></div>
			<div class="grand-total-container" style="line-height: 0rem;">
				<div>${__("Total")}</div>
				<div>0.00</div>
			</div> 

			<div class="checkout-btn">${__("Order")}</div>
			<div class="edit-cart-btn">${__("Edit Cart")}</div>`
		);

		this.$add_discount_elem = this.$component.find(".add-discount-wrapper");
	}

	make_cart_numpad() {
		this.$numpad_section = this.$component.find(".numpad-section");

		this.number_pad = new custom_app.PointOfSale.NumberPad({
			wrapper: this.$numpad_section,
			events: {
				numpad_event: this.on_numpad_event.bind(this),
			},
			cols: 5,
			keys: [
				// [1, 2, 3, "Quantity"],
				// [4, 5, 6, "Discount"],
				// [7, 8, 9, "Rate"],
				// [".", 0, "Delete", "Remove"],
				["Discount", "Quantity","", "Remove"],
			],
			css_classes: [
				["", "", "", "col-span-2 remove-btn"],
				["", "", "", "col-span-2"],
				["", "", "", "col-span-2"],
				["", "", "", "col-span-2"],
				// ["", "", "", "col-span-2 remove-btn"],
			],
			fieldnames_map: { Quantity: "qty", Discount: "discount_percentage" },
		});

		this.$numpad_section.prepend(
			`<div class="numpad-totals">
			<span class="numpad-item-qty-total"></span>
				<span class="numpad-net-total"></span>
				<span class="numpad-grand-total"></span>
			</div>`
		);

		this.$numpad_section.append(
			`<div class="numpad-btn checkout-btn" data-button-value="checkout">${__("Order")}</div>`
		);
	}

	bind_events() {
		const me = this;
		this.$customer_section.on("click", ".reset-customer-btn", function () {
			me.reset_customer_selector();
		});

		this.$customer_section.on("click", ".close-details-btn", function () {
			me.toggle_customer_info(false);
		});

		this.$customer_section.on("click", ".customer-display", function (e) {
			if ($(e.target).closest(".reset-customer-btn").length) return;

			const show = me.$cart_container.is(":visible");
			me.toggle_customer_info(show);
		});

		//Doctors

		this.$doctor_section.on("click", ".reset-doctor-btn", function () {
			me.reset_doctor_selector();
		});

		this.$doctor_section.on("click", ".close-details-btn", function () {
			me.toggle_doctor_info(false);
		});

		this.$doctor_section.on("click", ".doctor-display", function (e) {
			if ($(e.target).closest(".reset-doctor-btn").length) return;

			const show = me.$cart_container.is(":visible");
			me.toggle_doctor_info(show);
		});


		this.$cart_items_wrapper.on("click", ".cart-item-wrapper", function () {
			const $cart_item = $(this);
			me.toggle_item_highlight(this);
			const payment_section_hidden = !me.$totals_section.find(".edit-cart-btn").is(":visible");
			if (!payment_section_hidden) {
				// payment section is visible
				// edit cart first and then open item details section
				me.$totals_section.find(".edit-cart-btn").click();
				return;
			}
			const item_row_name = unescape($cart_item.attr("data-row-name"));
			me.events.cart_item_clicked({ name: item_row_name });
			this.numpad_value = "";
		});



		this.$component.on("click", ".checkout-btn", async function () {
			if ($(this).attr("style").indexOf("--blue-500") == -1) return;

			await me.events.checkout();
			me.toggle_checkout_btn(false);

			me.allow_discount_change && me.$add_discount_elem.removeClass("d-none");
		});

		this.$totals_section.on("click", ".edit-cart-btn", () => {
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
							if (r.message && r.message.name) {
								// OIC authentication successful, proceed with editing the cart
								this.events.edit_cart();
								this.toggle_checkout_btn(true);
								this.passwordDialog.hide();
							} else {
								// Show alert for incorrect password or unauthorized user
								frappe.show_alert({
									message: __('Incorrect password or user is not an OIC'),
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
		});
		

		this.$component.on("click", ".add-discount-wrapper", () => {
			// Check if OIC authentication is required
			if (!this.is_oic_authenticated) {
				// OIC authentication required, show password dialog
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
					primary_action_label: __('Add Discount'),
					primary_action: (values) => {
						let password = values.password;
						let role = "oic";

						frappe.call({
							method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.confirm_user_password",
							args: { password: password, role: role },
							callback: (r) => {
								if (r.message) {
									// OIC authentication successful, proceed with editing the cart
									this.is_oic_authenticated = true;
									this.show_discount_control();
									passwordDialog.hide();
								} else {
									// Show alert for incorrect password or unauthorized user
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
			} else {
				// OIC authenticated, proceed with showing the discount control
				const can_edit_discount = this.$add_discount_elem.find(".edit-discount-btn").length;
				if (!this.discount_field || can_edit_discount) this.show_discount_control();
			}
		});

		// Event handler for editing the discount field
		this.$add_discount_elem.find(".edit-discount-btn").on("click", () => {
			// Reset OIC authentication flag and prompt for authentication
			this.is_oic_authenticated = false;
			this.$component.trigger("click", ".add-discount-wrapper");
		});

		frappe.ui.form.on("POS Invoice", "paid_amount", (frm) => {
			// called when discount is applied
			this.update_totals_section(frm);
		});
	}

	attach_shortcuts() {

		document.addEventListener('keydown', function (event) {
			// List of key codes to prevent
			const keysToPrevent = {
				// Prevent F5 (refresh)
				116: true,
				// Prevent Ctrl+R (refresh)
				'Ctrl+82': true,
				// Prevent Ctrl+Shift+R (refresh)
				'Ctrl+16+82': true,
				// Prevent Ctrl+S (save)
				'Ctrl+83': true,
				// Prevent Ctrl+P (print)
				'Ctrl+80': true,
				// Prevent Ctrl+W (close tab)
				'Ctrl+87': true,
				// Prevent Ctrl+Shift+I (Developer Tools)
				'Ctrl+Shift+73': true,
				// Prevent Ctrl+J (Downloads)
				'Ctrl+74': true,
				// Prevent Ctrl+E
				'Ctrl+69': true,
				// Prevent Ctrl+Q
				// 'Ctrl+18+81': true,
			};

			// Generate the key identifier
			const key = (event.ctrlKey ? 'Ctrl+' : '') +
				(event.shiftKey ? 'Shift+' : '') +
				(event.altKey ? 'Alt+' : '') +
				event.keyCode;

			if (keysToPrevent[key] || keysToPrevent[event.keyCode]) {
				event.preventDefault();
			}
		});


		for (let row of this.number_pad.keys) {
			for (let btn of row) {
				if (typeof btn !== "string") continue; // do not make shortcuts for numbers

				let shortcut_key = `ctrl+${frappe.scrub(String(btn))[0]}`;
				if (btn === "Delete") shortcut_key = "ctrl+backspace";
				if (btn === "Remove") shortcut_key = "ctrl+x";
				if (btn === "Quantity") shortcut_key = "ctrl+q";
				if (btn === "Rate") shortcut_key = "ctrl+a";
				if (btn === "Discount") shortcut_key = "ctrl+shift+d";
				if (btn === ".") shortcut_key = "ctrl+>";

				// to account for fieldname map
				const fieldname = this.number_pad.fieldnames[btn]
					? this.number_pad.fieldnames[btn]
					: typeof btn === "string"
						? frappe.scrub(btn)
						: btn;

				let shortcut_label = shortcut_key.split("+").map(frappe.utils.to_title_case).join("+");
				shortcut_label = frappe.utils.is_mac() ? shortcut_label.replace("Ctrl", "⌘") : shortcut_label;
				this.$numpad_section
					.find(`.numpad-btn[data-button-value="${fieldname}"]`)
					.attr("title", shortcut_label);

				frappe.ui.keys.on(`${shortcut_key}`, () => {
					const cart_is_visible = this.$component.is(":visible");
					if (cart_is_visible && this.item_is_selected && this.$numpad_section.is(":visible")) {
						this.$numpad_section.find(`.numpad-btn[data-button-value="${fieldname}"]`).click();
					}
				});
			}
		}
		const ctrl_label = frappe.utils.is_mac() ? "⌘" : "Ctrl";
		this.$component.find(".checkout-btn").attr("title", `${ctrl_label}+Enter`);
		frappe.ui.keys.add_shortcut({
			shortcut: "ctrl+enter",
			action: () => this.$component.find(".checkout-btn").click(),
			condition: () =>
				this.$component.is(":visible") && !this.$totals_section.find(".edit-cart-btn").is(":visible"),
			description: __("Checkout Order / Submit Order / New Order"),
			ignore_inputs: true,
			page: cur_page.page.page,
		});


		this.$component.find(".edit-cart-btn").attr("title", `${ctrl_label}+E`);
		frappe.ui.keys.on("ctrl+e", () => {
			const item_cart_visible = this.$component.is(":visible");
			const checkout_btn_invisible = !this.$totals_section.find(".checkout-btn").is("visible");
			if (item_cart_visible && checkout_btn_invisible) {
				this.$component.find(".edit-cart-btn").click();
			}
		});
		this.$component.find(".add-discount-wrapper").attr("title", `${ctrl_label}+D`);
		frappe.ui.keys.add_shortcut({
			shortcut: "ctrl+d",
			action: () => this.$component.find(".add-discount-wrapper").click(),
			condition: () => this.$add_discount_elem.is(":visible"),
			description: __("Add Order Discount"),
			ignore_inputs: true,
			page: cur_page.page.page,
		});
		frappe.ui.keys.on("escape", () => {
			const item_cart_visible = this.$component.is(":visible");
			if (item_cart_visible && this.discount_field && this.discount_field.parent.is(":visible")) {
				this.discount_field.set_value(0);
			}
		});

		this.doctor_field.parent.attr("title", `${ctrl_label}+R`);
		frappe.ui.keys.add_shortcut({
			shortcut: "ctrl+r",
			action: () => this.doctor_field.set_focus(),
			condition: () => this.$component.is(":visible"),
			description: __("Doctor"),
			ignore_inputs: true,
			page: cur_page.page.page,
		});

		this.customer_field.parent.attr("title", `${ctrl_label}+M`);
		frappe.ui.keys.add_shortcut({
			shortcut: "ctrl+m",
			action: () => this.customer_field.set_focus(),
			condition: () => this.$component.is(":visible"),
			description: __("Customer"),
			ignore_inputs: true,
			page: cur_page.page.page,
		});

		frappe.ui.keys.add_shortcut({
			shortcut: 'ctrl+<', // Choose an appropriate shortcut key
			action: () => {
				this.reset_customer_selector();
			},
			condition: () => true, // Adjust this condition as needed
			description: __('Reset Customer Selector'),
			ignore_inputs: true,
			page: cur_page.page.page // Replace with your actual page context
		});

	}

	toggle_item_highlight(item) {
		const $cart_item = $(item);
		const item_is_highlighted = $cart_item.attr("style") == "background-color:var(--gray-50);";

		if (!item || item_is_highlighted) {
			this.item_is_selected = false;
			this.$cart_container.find(".cart-item-wrapper").css("background-color", "");
		} else {
			$cart_item.css("background-color", "var(--control-bg)");
			this.item_is_selected = true;
			this.$cart_container.find(".cart-item-wrapper").not(item).css("background-color", "");
		}
	}

	make_customer_selector() {
		this.$customer_section.html(`
			<div class="customer-field" tabindex="0"></div>
		`);
		const me = this;
		const allowed_customer_group = this.allowed_customer_groups || [];
		let filters = {};
		if (allowed_customer_group.length) {
			filters = {
				customer_group: ["in", allowed_customer_group],
			};
		}
		this.customer_field = frappe.ui.form.make_control({
			df: {
				label: __("Customer"),
				fieldtype: "Link",
				options: "Customer",
				placeholder: __("Search by customer name, phone, email."),
				get_query: function () {
					return {
						filters: filters,
					};
				},
				onchange: function () {
					if (this.value) {
						const frm = me.events.get_frm();
						frappe.dom.freeze();
						frappe.model.set_value(frm.doc.doctype, frm.doc.name, "customer", this.value);
						frm.script_manager.trigger("customer", frm.doc.doctype, frm.doc.name).then(() => {
							frappe.run_serially([
								() => me.fetch_customer_details(this.value),
								() => me.events.customer_details_updated(me.customer_info),
								() => me.update_customer_section(),
								() => frappe.dom.unfreeze(),
							]);
						});
					}
				},
			},
			parent: this.$customer_section.find(".customer-field"),
			render_input: true,
		});
		this.customer_field.toggle_label(false);
	}

	validate_scanned_data(scannedData) {
		const me = this;
		const frm = me.events.get_frm();
	
		if (scannedData && scannedData.length > 0) {
			// If Amesco Plus is scanned, automatically set the customer
			frappe.model.set_value(frm.doc.doctype, frm.doc.name, "customer", "CUST-00027987");
	
			// frappe.msgprint({
			// 	title: __('Success'),
			// 	message: __('Amesco Plus scanned successfully.'),
			// 	indicator: 'green'
			// });
	
			frappe.run_serially([
				() => me.fetch_customer_details("CUST-00027987"),
				() => me.events.customer_details_updated(me.customer_info),
				() => me.update_customer_section()
			]);
		} else {
			frappe.msgprint({
				title: __('Error'),
				message: __('Scanned data is invalid or missing'),
				indicator: 'red'
			});
		}
	}
	make_doctor_selector() {
		this.$doctor_section.html(`
        <div class="doctor-field"></div>
    `);
		const me = this;
		const allowed_doctor_group = this.allowed_doctor_groups || [];
		let filters = {};
		if (allowed_doctor_group.length) {
			filters = {
				doctor_group: ["in", allowed_doctor_group],
			};
		}

		this.doctor_field = frappe.ui.form.make_control({
			df: {
				label: __("Doctor"),
				fieldtype: "Link",
				options: "Doctor",
				placeholder: __("Doctor"),
				onchange: function () {
					if (this.value) {
						const frm = me.events.get_frm();
						frappe.dom.freeze();
						frappe.model.set_value(frm.doc.doctype, frm.doc.name, "custom_doctors_information", this.value);
						frm.script_manager.trigger("custom_doctors_information", frm.doc.doctype, frm.doc.name).then(() => {
							frappe.run_serially([
								// () => me.fetch_customer_details(this.value),
								// () => me.events.customer_details_updated(me.customer_info),
								// () => me.update_customer_section(),
								// () => me.update_totals_section(),
								() => frappe.dom.unfreeze(),
							]);
						});
					}
				},
			},
			parent: this.$doctor_section.find(".doctor-field"),
			render_input: true,
		});
		this.doctor_field.toggle_label(false);

		// Add shortcut key to focus on doctor field
		$(document).on('keydown', function (event) {
			// Use Alt + D as shortcut (you can change this key combination as needed)
			if (event.altKey && event.key === 'd') {
				me.doctor_field.$input.focus();
			}
		});
	}


	fetch_customer_details(customer) {
		if (customer) {
			return new Promise((resolve) => {
				frappe.db
					.get_value("Customer", customer, ["email_id", "customer_name", "mobile_no" , "image", "loyalty_program",
						"custom_osca_id", "custom_pwd_id", "customer_group"])
					.then(({ message }) => {
						const { loyalty_program } = message;
						// if loyalty program then fetch loyalty points too
						if (loyalty_program) {
							frappe.call({
								method: "erpnext.accounts.doctype.loyalty_program.loyalty_program.get_loyalty_program_details_with_points",
								args: { customer, loyalty_program, silent: true },
								callback: (r) => {
									const { loyalty_points, conversion_factor } = r.message;
									if (!r.exc) {
										this.customer_info = {
											...message,
											customer,
											loyalty_points,
											conversion_factor,
										};
										resolve();
									}
								},
							});
						} else {
							this.customer_info = { ...message, customer };
							resolve();
						}
					});
			});
		} else {
			return new Promise((resolve) => {
				this.customer_info = {};
				resolve();
			});
		}
	}


	fetch_doctor_details(doctor) {
		if (doctor) {
			return new Promise((resolve) => {
				frappe.db
					.get_value("Doctor", doctor, ["first_name", "last_name", "prc_number", "image"])
					.then(({ message }) => {
						// const { loyalty_program } = message;
						// if loyalty program then fetch loyalty points too
						this.doctor_info = { ...message, doctor };
						console.log(this.doctor_info);
						resolve();
					});
			});
		} else {
			return new Promise((resolve) => {
				this.doctor_info = {};
				resolve();
			});
		}
	}

	show_discount_control() {
		this.$add_discount_elem.css({ padding: "0px", border: "none" });
		this.$add_discount_elem.html(`<div class="add-discount-field"></div>`);
		const me = this;
		const frm = me.events.get_frm();
		let discount = frm.doc.additional_discount_percentage;

		this.discount_field = frappe.ui.form.make_control({
			df: {
				label: __("Discount"),
				fieldtype: "Data",
				placeholder: discount ? discount + "%" : __("Enter discount percentage."),
				input_class: "input-xs",
				onchange: function () {
					if (flt(this.value) != 0) {
						frappe.model.set_value(
							frm.doc.doctype,
							frm.doc.name,
							"additional_discount_percentage",
							flt(this.value)
						);
						me.hide_discount_control(this.value);
					} else {
						frappe.model.set_value(
							frm.doc.doctype,
							frm.doc.name,
							"additional_discount_percentage",
							0
						);
						me.$add_discount_elem.css({
							border: "1px dashed var(--gray-500)",
							padding: "var(--padding-sm) var(--padding-md)",
						});
						me.$add_discount_elem.html(`${me.get_discount_icon()} ${__("Add Discount")}`);
						me.discount_field = undefined;
					}
				},
			},
			parent: this.$add_discount_elem.find(".add-discount-field"),
			render_input: true,
		});
		this.discount_field.toggle_label(false);
		this.discount_field.set_focus();
	}

	hide_discount_control(discount) {
		if (!discount) {
			this.$add_discount_elem.css({ padding: "0px", border: "none" });
			this.$add_discount_elem.html(`<div class="add-discount-field"></div>`);
		} else {
			this.$add_discount_elem.css({
				border: "1px dashed var(--dark-green-500)",
				padding: "var(--padding-sm) var(--padding-md)",
			});
			this.$add_discount_elem.html(
				`<div class="edit-discount-btn">
					${this.get_discount_icon()} ${__("Additional")}&nbsp;${String(discount).bold()}% ${__("discount applied")}
				</div>`
			);
		}
	}

	update_customer_section() {
		const me = this;
		const { customer, email_id = "", mobile_no = "", image, customer_name = "", customer_group = "" } = this.customer_info || {};

		if (customer) {
			this.$customer_section.html(
				`<div class="customer-details">
					<div class="customer-display">
						${this.get_customer_image()}
						<div class="customer-name-desc">
							<div class="customer-name"> ${customer_name} -  ${customer_group} </div>
							${get_customer_description()}
						</div>
					</div>
				</div>`
			);
		} else {
			// reset customer selector
			this.reset_customer_selector();
		}

		function get_customer_description() {
			if (!email_id && !mobile_no) {
				return `<div class="customer-desc">${__("Click to add email / phone")}</div>`;
			} else if (email_id && !mobile_no) {
				return `<div class="customer-desc">${email_id}</div>`;
			} else if (mobile_no && !email_id) {
				return `<div class="customer-desc">${mobile_no}</div>`;
			} else {
				return `<div class="customer-desc">${email_id} - ${mobile_no}</div>`;
			}
		}


	}

	//doctor

	update_doctor_section() {
		const me = this;
		const { doctor, first_name = "", last_name = "", prc_number = "", image } = this.doctor_info || {};

		if (doctor) {
			this.$doctor_section.html(
				`<div class="doctor-details">
					<div class="doctor-display">
						${this.get_doctor_image()}
						<div class="doctor-name-desc">
							<div class="doctor-name">${doctor}</div>
							${get_doctor_description()}
						</div>
						<div class="reset-doctors-btn" data-doctors="${escape(doctors)}">
							<svg width="32" height="32" viewBox="0 0 14 14" fill="none">
								<path d="M4.93764 4.93759L7.00003 6.99998M9.06243 9.06238L7.00003 6.99998M7.00003 6.99998L4.93764 9.06238L9.06243 4.93759" stroke="#8D99A6"/>
							</svg>
						</div>
					</div>
				</div>`
			);
		} else {
			// reset doctor selector
			this.reset_doctor_selector();
		}

		function get_doctor_description() {
			if (!email_id && !mobile_no) {
				return `<div class="doctor-desc">${__("Click to add email / phone")}</div>`;
			} else if (email_id && !mobile_no) {
				return `<div class="doctor-desc">${email_id}</div>`;
			} else if (mobile_no && !email_id) {
				return `<div class="doctor-desc">${mobile_no}</div>`;
			} else {
				return `<div class="doctorvv-desc">${email_id} - ${mobile_no}</div>`;
			}
		}

	}

	get_customer_image() {
		const { customer, image } = this.customer_info || {};
		if (image) {
			return `<div class="customer-image"><img src="${image}" alt="${image}""></div>`;
		} else {
			return `<div class="customer-image customer-abbr">${frappe.get_abbr(customer)}</div>`;
		}
	}

	get_doctor_image() {
		const { doctor, image } = this.doctor_info || {};
		if (image) {
			return `<div class="doctor-image"><img src="${image}" alt="${image}""></div>`;
		} else {
			return `<div class="doctor-image doctor-abbr">${frappe.get_abbr(doctor)}</div>`;
		}
	}

	update_totals_section(frm) {
		if (!frm) frm = this.events.get_frm();
		// console.log(frm.doc);
		
		this.render_vatable_sales(frm.doc.custom_vatable_sales);
		this.render_vat_exempt_sales(frm.doc.custom_vat_exempt_sales);
		this.render_zero_rated_sales(frm.doc.custom_zero_rated_sales);
		// this.render_vat(frm.doc.custom_vat_amount)
		// this.render_ex_total(frm.doc.custom_ex_total)
		this.render_net_total(frm.doc.net_total);
		this.render_total_item_qty(frm.doc.items);

		const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
			? frm.doc.grand_total
			: frm.doc.rounded_total;
			
		this.render_grand_total(grand_total);
		// this.render_taxes(frm.doc.taxes);
		this.render_total_vat(frm.doc.total_taxes_and_charges);
	}

	render_net_total(value) {
		const currency = this.events.get_frm().doc.currency;
		this.$totals_section
			.find(".net-total-container")
			.html(`<div style="font-size:12px;">${__("Sub Total")}</div> <div>${format_currency(value, currency)}</div>`);

		this.$numpad_section
			.find(".numpad-net-total")
			.html(`<div>${__("Sub Total")}: <span>${format_currency(value, currency)}</span></div>`);
	}

	render_vatable_sales(value) {
		const currency = this.events.get_frm().doc.currency;
		this.$totals_section
			.find(".vatable-sales-container")
			.html(`
				<div style="display: flex; align-items: center; width: 100%; font-size:12px;">
					<span style="flex: 1;">
						${__("VATable Sales")}: 
					</span>
					<span style="flex-shrink: 0;  ">${format_currency(value, currency)}</span>
					</span>
				</div>
			`);
	}
	

	render_vat_exempt_sales(value) {
		const currency = this.events.get_frm().doc.currency;
		this.$totals_section
			.find(".vat-exempt-container")
			.html(`
				<div style="display: flex; align-items: center; width: 100%; font-size:12px;">
					<span style="flex: 1;">
						${__("VAT-Exempt Sales")}: 
					</span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
	}

	render_zero_rated_sales(value) {
		const currency = this.events.get_frm().doc.currency;
		this.$totals_section
			.find(".zero-rated-container")
			.html(`
				<div style="display: flex; align-items: center; width: 100%; font-size:12px;">
					<span style="flex: 1;">
						${__("Zero Rated Sales")}: 
					</span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
	}

	render_vat(value) {
		const currency = this.events.get_frm().doc.currency;
		this.$totals_section
			.find(".vat-container")
			.html(`
				<div style="display: flex; align-items: center; width: 100%; font-size:12px;">
					<span style="flex: 1;">
						${__("VAT 12%")}:
					</span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
	}

	render_total_vat(value) {
		const currency = this.events.get_frm().doc.currency;
		this.$totals_section
			.find(".total-vat-container")
			.html(`
				<div style="display: flex; justify-content: space-between; font-size:12px;">
					<span style="flex: 1;">${__("Total VAT")}: </span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
	}

	render_ex_total(value) {
		const currency = this.events.get_frm().doc.currency;
		this.$totals_section
			.find(".ex-total-container")
			.html(`
				<div style="display: flex; align-items: center; width: 100%; font-size:10px;>
					<span style="flex: 1;">
						${__("Ex Total")}: 
					</span>
					<span style="flex-shrink: 0;">${format_currency(value, currency)}</span>
				</div>
			`);
	}


	render_total_item_qty(items) {
		var total_item_qty = 0;
		items.map((item) => {
			total_item_qty = total_item_qty + item.qty;
		});

		this.$totals_section
			.find(".item-qty-total-container")
			.html(`<div>${__("Total Quantity")}</div><div>${total_item_qty}</div>`);

		this.$numpad_section
			.find(".numpad-item-qty-total")
			.html(`<div>${__("Total Quantity")}: <span>${total_item_qty}</span></div>`);
	}

	render_grand_total(value) {
		const currency = this.events.get_frm().doc.currency;
		this.$totals_section
			.find(".grand-total-container")
			.html(`<div style="font-size:14px;">${__("Total")}</div><div>${format_currency(value, currency)}</div>`);

		this.$numpad_section
			.find(".numpad-grand-total")
			.html(`<div>${__("Total")}: <span>${format_currency(value, currency)}</span></div>`);
	}


	render_taxes(taxes) {
		if (taxes && taxes.length) {
			const currency = this.events.get_frm().doc.currency;
			const taxes_html = taxes
				.map((t) => {
					if (t.tax_amount_after_discount_amount == 0.0) return;
					// if tax rate is 0, don't print it.
					const description = /[0-9]+/.test(t.description)
						? t.description
						: t.rate != 0
							? `${t.description} ${t.rate}%`
							: t.description;
					return `<div class="tax-row">
					<div class="tax-label">${description}</div>
					<div class="tax-value">${format_currency(t.tax_amount_after_discount_amount, currency)}</div>
				</div>`;
				})
				.join("");
			this.$totals_section.find(".taxes-container").css("display", "flex").html(taxes_html);
		} else {
			this.$totals_section.find(".taxes-container").css("display", "none").html("");
		}
	}





	get_cart_item({ name }) {
		const item_selector = `.cart-item-wrapper[data-row-name="${escape(name)}"]`;
		return this.$cart_items_wrapper.find(item_selector);
	}

	get_item_from_frm(item) {
		const doc = this.events.get_frm().doc;
		return doc.items.find((i) => i.name == item.name);
	}

	update_item_html(item, remove_item) {
		const $item = this.get_cart_item(item);
		// Retrieve current cart items from local storage
		let cartItems = JSON.parse(localStorage.getItem('posCartItems')) || [];

		if (remove_item) {
			if ($item) {
				$item.next().remove();
				$item.remove();

				// Remove the item from the local storage cart items
				cartItems = cartItems.filter(cartItem => cartItem.item_code !== item.item_code);

				localStorage.setItem('posCartItems', JSON.stringify(cartItems));

				this.remove_customer(); // Call remove_customer function after removing item
				this.set_cash_customer(); // Set customer to "Cash" after removing item
				frappe.run_serially([
					() => frappe.dom.unfreeze(),
				]);
			}
		} else {
			const item_row = this.get_item_from_frm(item);

			this.render_cart_item(item_row, $item);

			// Add or update the item in the local storage cart items
			const existingItemIndex = cartItems.findIndex(cartItem => cartItem.item_code === item.item_code);
			if (existingItemIndex > -1) {
				cartItems[existingItemIndex] = item; // Update existing item
			} else {
				cartItems.push(item); // Add new item
			}
			localStorage.setItem('posCartItems', JSON.stringify(cartItems));
			// console.log('cartItems', cartItems)
		}

		const no_of_cart_items = this.$cart_items_wrapper.find(".cart-item-wrapper").length;
		this.highlight_checkout_btn(no_of_cart_items > 0);
		this.update_empty_cart_section(no_of_cart_items);
	}


	remove_customer() {
		const frm = this.events.get_frm();
		// Get the current value of the "customer" field
		const currentCustomer = frm.doc.customer;

		// Set the value of "custom_customer_2" to the current customer
		frappe.model.set_value(frm.doc.doctype, frm.doc.name, "custom_customer_2", currentCustomer);

		// Clear the "customer" field
		frappe.model.set_value(frm.doc.doctype, frm.doc.name, "customer", '');
		// Update the customer section
		this.update_customer_section();
	}

	set_cash_customer() {
		const frm = this.events.get_frm();
		// Get the value of "custom_customer_2"
		const customCustomer2Value = frm.doc.custom_customer_2;

		// Set the value of "customer" to the value of "custom_customer_2"
		frappe.model.set_value(frm.doc.doctype, frm.doc.name, "customer", customCustomer2Value);

		// Update the customer section
		this.update_customer_section();
	}

	render_cart_item(item_data, $item_to_update) {

		// console.log("Item Data: ",item_data)

		const currency = this.events.get_frm().doc.currency;
		const me = this;
		const customer_group = me.events.get_frm().doc.customer_group
		const tax_rate = 0.12;
		const no_vat = item_data.price_list_rate / (1 + tax_rate);

		// const item_doc = frappe.get_doc('Item', item_data.item_name)
		// console.log("Item Doc: ", item_doc);

		if (!$item_to_update.length) {
			this.$cart_items_wrapper.append(
				`<div class="cart-item-wrapper" tabindex="0" data-row-name="${escape(item_data.name)}" style="font-size: 12px; padding: 5px;">
					<div class="separator" style="height: 0.8px; background-color: #e0e0e0; margin: 4px 0;"></div>`
			);
			$item_to_update = this.get_cart_item(item_data);
		}
		
		$item_to_update.html(
			`${get_item_image_html()}
			<div class="item-name-desc" style="font-size: 10px;">
				<div class="item-name" style="font-size: 12px;">
					${item_data.item_name}
				</div>
				${get_description_html()}
			</div>
			
			<div class="item-vat mx-3" style="font-size: 10px;">
				<strong>${getVatType(item_data)}</strong>
			</div> 
			
			<div class="item-vat mx-3" style="font-size: 10px;">
				<strong>${format_currency(item_data.price_list_rate, currency)}</strong>
			</div>
			
			<div class="item-discount mx-3" style="font-size: 10px;">
				<strong>${Math.round(item_data.discount_percentage)}%</strong>
			</div>
			${get_rate_discount_html()}`
		);
		

		set_dynamic_rate_header_width();

		function set_dynamic_rate_header_width() {
			const rate_cols = Array.from(me.$cart_items_wrapper.find(".item-rate-amount"));
			me.$cart_header.find(".rate-amount-header").css("width", "");
			me.$cart_items_wrapper.find(".item-rate-amount").css("width", "");
			let max_width = rate_cols.reduce((max_width, elm) => {
				if ($(elm).width() > max_width) max_width = $(elm).width();
				return max_width;
			}, 0);

			max_width += 1;
			if (max_width === 1) max_width = "";

			me.$cart_header.find(".rate-amount-header").css("width", max_width);
			me.$cart_items_wrapper.find(".item-rate-amount").css("width", max_width);
		}

		function getVatType(item_data) {
			if (item_data.custom_vat_exempt_amount && item_data.custom_vat_exempt_amount != 0) {
				return 'VAT-E';
			} else if (item_data.custom_vatable_amount && item_data.custom_vatable_amount != 0) {
				return 'VAT';
			} else if (item_data.custom_zero_rated_amount && item_data.custom_zero_rated_amount != 0) {
				return 'ZR';
			}else if (item_data.custom_free === 1) {
					return 'FREE';
				
			} else {

				return 'Unknown';
			}
		}

		function get_rate_discount_html() {

			if (item_data.rate && item_data.amount && item_data.rate !== item_data.amount) {
				return `
					<div class="item-qty-rate">
						<div class="item-qty" style="font-size:10px;"><span>${item_data.qty || 0} ${item_data.uom}</span></div>
						<div class="item-rate-amount">
							<div class="item-rate" style="font-size:11px;">${format_currency(item_data.amount, currency)}</div>
						</div>
					</div>`;
			} else {
				return `
					<div class="item-qty-rate">
						<div class="item-qty" style="font-size:10px;"><span>${item_data.qty || 0} ${item_data.uom}</span></div>
						<div class="item-rate-amount">
							<div class="item-rate" style="font-size:11px;">${format_currency(item_data.rate, currency)}</div>
						</div>
					</div>`;
			}
		
	}

		function get_description_html() {
			if (item_data.description) {
				if (item_data.description.indexOf("<div>") !== -1) {
					try {
						item_data.description = $(item_data.description).text();
					} catch (error) {
						item_data.description = item_data.description
							.replace(/<div>/g, " ")
							.replace(/<\/div>/g, " ")
							.replace(/ +/g, " ");
					}
				}
				item_data.description = frappe.ellipsis(item_data.description, 45);
				return `<div class="item-desc" style="font-size:10px;">${item_data.description}</div>`;
			}
			return ``;
		}

		function get_item_image_html() {
			const { image, item_name } = item_data;
			if (!me.hide_images && image) {
				return `
					<div class="item-image">
						<img
							onerror="cur_pos.cart.handle_broken_image(this)"
							src="${image}" alt="${frappe.get_abbr(item_name)}">
					</div>`;
			} else {
				return `<div class="item-image item-abbr">${frappe.get_abbr(item_name)}</div>`;
			}
		}

		// Event listener for handling keydown events on cart items
		this.$cart_items_wrapper.off('keydown', '.cart-item-wrapper').on('keydown', '.cart-item-wrapper', function (event) {
			const $items = me.$cart_items_wrapper.find('.cart-item-wrapper');
			const currentIndex = $items.index($(this));
			let nextIndex = currentIndex;

			switch (event.which) {
				case 13: // Enter key
					$(this).click(); // Trigger click event immediately on Enter key press
					break;
				case 38: // Up arrow key
					nextIndex = currentIndex > 0 ? currentIndex - 1 : $items.length - 1;
					break;
				case 40: // Down arrow key
					nextIndex = currentIndex < $items.length - 1 ? currentIndex + 1 : 0;
					break;
				default:
					return; // Exit if other keys are pressed
			}

			$items.eq(nextIndex).focus(); // Move focus to the next item
		});

		// Add Ctrl+C shortcut to focus on the first cart item
		frappe.ui.keys.add_shortcut({
			shortcut: 'ctrl+c',
			action: () => {
				const $items = me.$cart_items_wrapper.find('.cart-item-wrapper');
				if ($items.length) {
					$items.first().focus(); // Focus on the first cart item
				}
			},
			condition: () => me.$cart_items_wrapper.is(':visible'),
			description: __('Activate Cart Item Focus'),
			ignore_inputs: true,
			page: cur_page.page.page // Replace with your actual page context
		});
	}



	handle_broken_image($img) {
		const item_abbr = $($img).attr("alt");
		$($img).parent().replaceWith(`<div class="item-image item-abbr">${item_abbr}</div>`);
	}

	update_selector_value_in_cart_item(selector, value, item) {
		const $item_to_update = this.get_cart_item(item);
		$item_to_update.attr(`data-${selector}`, escape(value));
	}

	toggle_checkout_btn(show_checkout) {
		if (show_checkout) {
			this.$totals_section.find(".checkout-btn").css("display", "flex");
			this.$totals_section.find(".edit-cart-btn").css("display", "none");
		} else {
			this.$totals_section.find(".checkout-btn").css("display", "none");
			this.$totals_section.find(".edit-cart-btn").css("display", "flex");
		}
	}

	highlight_checkout_btn(toggle) {
		if (toggle) {
			this.$add_discount_elem.css("display", "flex");
			this.$cart_container.find(".checkout-btn").css({
				"background-color": "var(--blue-500)",
			});
		} else {
			this.$add_discount_elem.css("display", "none");
			this.$cart_container.find(".checkout-btn").css({
				"background-color": "var(--blue-200)",
			});
		}
	}

	update_empty_cart_section(no_of_cart_items) {
		const $no_item_element = this.$cart_items_wrapper.find(".no-item-wrapper");

		// if cart has items and no item is present
		no_of_cart_items > 0 &&
			$no_item_element &&
			$no_item_element.remove() &&
			this.$cart_header.css("display", "flex");

		no_of_cart_items === 0 && !$no_item_element.length && this.make_no_items_placeholder();
	}

	on_numpad_event($btn) {
		const current_action = $btn.attr("data-button-value");
		const action_is_field_edit = ["qty", "discount_percentage", "rate"].includes(current_action);
		const action_is_allowed = action_is_field_edit
			? (current_action == "rate" && this.allow_rate_change) ||
			(current_action == "discount_percentage" && this.allow_discount_change) ||
			current_action == "qty"
			: true;

		const action_is_pressed_twice = this.prev_action === current_action;
		const first_click_event = !this.prev_action;
		const field_to_edit_changed = this.prev_action && this.prev_action != current_action;

		if (action_is_field_edit) {
			if (!action_is_allowed) {
				const label = current_action == "rate" ? "Rate".bold() : "Discount".bold();
				const message = __("Editing {0} is not allowed as per POS Profile settings", [label]);
				frappe.show_alert({
					indicator: "red",
					message: message,
				});
				frappe.utils.play_sound("error");
				return;
			}

			if (first_click_event || field_to_edit_changed) {
				this.prev_action = current_action;
			} else if (action_is_pressed_twice) {
				this.prev_action = undefined;
			}
			this.numpad_value = "";
		} else if (current_action === "checkout") {
			this.prev_action = undefined;
			this.toggle_item_highlight();
			this.events.numpad_event(undefined, current_action);
			return;
		} else if (current_action === "remove") {
			this.prev_action = undefined;
			this.toggle_item_highlight();
			this.events.numpad_event(undefined, current_action);
			return;
		} else {
			this.numpad_value =
				current_action === "delete"
					? this.numpad_value.slice(0, -1)
					: this.numpad_value + current_action;
			this.numpad_value = this.numpad_value || 0;
		}

		const first_click_event_is_not_field_edit = !action_is_field_edit && first_click_event;

		if (first_click_event_is_not_field_edit) {
			frappe.show_alert({
				indicator: "red",
				message: __("Please select a field to edit from numpad"),
			});
			frappe.utils.play_sound("error");
			return;
		}

		if (flt(this.numpad_value) > 100 && this.prev_action === "discount_percentage") {
			frappe.show_alert({
				message: __("Discount cannot be greater than 100%"),
				indicator: "orange",
			});
			frappe.utils.play_sound("error");
			this.numpad_value = current_action;
		}

		this.highlight_numpad_btn($btn, current_action);
		this.events.numpad_event(this.numpad_value, this.prev_action);
	}

	highlight_numpad_btn($btn, curr_action) {
		const curr_action_is_highlighted = $btn.hasClass("highlighted-numpad-btn");
		const curr_action_is_action = ["qty", "discount_percentage", "rate", "done"].includes(curr_action);

		if (!curr_action_is_highlighted) {
			$btn.addClass("highlighted-numpad-btn");
		}
		if (this.prev_action === curr_action && curr_action_is_highlighted) {
			// if Qty is pressed twice
			$btn.removeClass("highlighted-numpad-btn");
		}
		if (this.prev_action && this.prev_action !== curr_action && curr_action_is_action) {
			// Order: Qty -> Rate then remove Qty highlight
			const prev_btn = $(`[data-button-value='${this.prev_action}']`);
			prev_btn.removeClass("highlighted-numpad-btn");
		}
		if (!curr_action_is_action || curr_action === "done") {
			// if numbers are clicked
			setTimeout(() => {
				$btn.removeClass("highlighted-numpad-btn");
			}, 200);
		}
	}

	toggle_numpad(show) {
		if (show) {
			this.$totals_section.css("display", "none");
			this.$numpad_section.css("display", "flex");
		} else {
			this.$totals_section.css("display", "flex");
			this.$numpad_section.css("display", "none");
		}
		this.reset_numpad();
	}

	reset_numpad() {
		this.numpad_value = "";
		this.prev_action = undefined;
		this.$numpad_section.find(".highlighted-numpad-btn").removeClass("highlighted-numpad-btn");
	}

	toggle_numpad_field_edit(fieldname) {
		if (["qty", "discount_percentage", "rate"].includes(fieldname)) {
			this.$numpad_section.find(`[data-button-value="${fieldname}"]`).click();
		}
	}

	toggle_customer_info(show) {
		if (show) {
			const { customer } = this.customer_info || {};

			this.$cart_container.css("display", "none");
			this.$customer_section.css({
				height: "100%",
				"padding-top": "0px",
			});
			this.$customer_section.find(".customer-details").html(
				`<div class="header">
					<div class="label">Contact Details</div>
					<div class="close-details-btn">
						<svg width="32" height="32" viewBox="0 0 14 14" fill="none">
							<path d="M4.93764 4.93759L7.00003 6.99998M9.06243 9.06238L7.00003 6.99998M7.00003 6.99998L4.93764 9.06238L9.06243 4.93759" stroke="#8D99A6"/>
						</svg>
					</div>
				</div>
				<div class="customer-display">
					${this.get_customer_image()}
					<div class="customer-name-desc">
						<div class="customer-name">${customer}</div>
						<div class="customer-desc"></div>
					</div>
				</div>
				<div class="customer-fields-container">
					<div class="email_id-field"></div>
					<div class="mobile_no-field"></div>
					<div class="custom_osca_id-field"></div>
					<div class="custom_pwd_id-field"></div>
					<div class="loyalty_program-field"></div>
					<div class="loyalty_points-field"></div>
				
				</div>
				<div class="transactions-label">Recent Transactions</div>`
			);
			// transactions need to be in diff div from sticky elem for scrolling
			this.$customer_section.append(`<div class="customer-transactions"></div>`);

			this.render_customer_fields();
			this.fetch_customer_transactions();
		} else {
			this.$cart_container.css("display", "flex");
			this.$customer_section.css({
				height: "",
				"padding-top": "",
			});

			this.update_customer_section();
		}
	}

	render_customer_fields() {
		const $customer_form = this.$customer_section.find(".customer-fields-container");

		const dfs = [
			{
				fieldname: "email_id",
				label: __("Email"),
				fieldtype: "Data",
				options: "email",
				placeholder: __("Enter customer's email"),
			},
			{
				fieldname: "mobile_no",
				label: __("Phone Number"),
				fieldtype: "Data",
				placeholder: __("Enter customer's phone number"),
			},
			{
				fieldname: "loyalty_program",
				label: __("Loyalty Program"),
				fieldtype: "Link",
				options: "Loyalty Program",
				placeholder: __("Select Loyalty Program"),
			},

			{
				fieldname: "loyalty_points",
				label: __("Loyalty Points"),
				fieldtype: "Data",
				read_only: 1,
			},

			{
				fieldname: "custom_osca_id",
				label: __("OSCA ID"),
				fieldtype: "Data",
				read_only: 1,
			},
			{
				fieldname: "custom_pwd_id",
				label: __("PWD ID"),
				fieldtype: "Data",
				read_only: 1,
			},

		];

		const me = this;
		dfs.forEach((df) => {
			this[`customer_${df.fieldname}_field`] = frappe.ui.form.make_control({
				df: { ...df, onchange: handle_customer_field_change },
				parent: $customer_form.find(`.${df.fieldname}-field`),
				render_input: true,
			});
			this[`customer_${df.fieldname}_field`].set_value(this.customer_info[df.fieldname]);
		});



		function handle_customer_field_change() {
			const current_value = me.customer_info[this.df.fieldname];
			const current_customer = me.customer_info.customer;

			if (this.value && current_value != this.value && this.df.fieldname != "loyalty_points") {
				frappe.call({
					method: "custom_app.customapp.page.amesco_point_of_sale.amesco_point_of_sale.set_customer_info",
					args: {
						fieldname: this.df.fieldname,
						customer: current_customer,
						value: this.value,
					},
					callback: (r) => {
						if (!r.exc) {
							me.customer_info[this.df.fieldname] = this.value;
							frappe.show_alert({
								message: __("Customer contact updated successfully."),
								indicator: "green",
							});
							frappe.utils.play_sound("submit");
						}
					},
				});
			}
		}
	}

	fetch_customer_transactions() {
		frappe.db
			.get_list("POS Invoice", {
				filters: { customer: this.customer_info.customer, docstatus: 1 },
				fields: ["name", "grand_total", "status", "posting_date", "posting_time", "currency", "custom_invoice_series"],
				limit: 20,
			})
			.then((res) => {
				const transaction_container = this.$customer_section.find(".customer-transactions");

				if (!res.length) {
					transaction_container.html(
						`<div class="no-transactions-placeholder">No recent transactions found</div>`
					);
					return;
				}

				const elapsed_time = moment(res[0].posting_date + " " + res[0].posting_time).fromNow();
				this.$customer_section.find(".customer-desc").html(`Last transacted ${elapsed_time}`);

				res.forEach((invoice) => {
					const posting_datetime = moment(invoice.posting_date + " " + invoice.posting_time).format(
						"Do MMMM, h:mma"
					);
					let indicator_color = {
						Paid: "green",
						Draft: "red",
						Return: "gray",
						Consolidated: "blue",
					};

					transaction_container.append(
						`<div class="invoice-wrapper" data-invoice-name="${escape(invoice.name)}">
						<div class="invoice-name-date">
							<div class="invoice-name">${invoice.custom_invoice_series}</div>
							<div class="invoice-date">${posting_datetime}</div>
						</div>
						<div class="invoice-total-status">
							<div class="invoice-total">
								${format_currency(invoice.grand_total, invoice.currency, 0) || 0}
							</div>
							<div class="invoice-status">
								<span class="indicator-pill whitespace-nowrap ${indicator_color[invoice.status]}">
									<span>${invoice.status}</span>
								</span>
							</div>
						</div>
					</div>
					<div class="seperator"></div>`
					);
				});
			});
	}

	attach_refresh_field_event(frm) {
		$(frm.wrapper).off("refresh-fields");
		$(frm.wrapper).on("refresh-fields", () => {
			if (frm.doc.items.length) {
				this.$cart_items_wrapper.html("");
				frm.doc.items.forEach((item) => {
					this.update_item_html(item);
				});
			}
			this.update_totals_section(frm);
		});
	}

	load_invoice() {
		const frm = this.events.get_frm();

		this.attach_refresh_field_event(frm);

		this.fetch_customer_details(frm.doc.customer).then(() => {
			this.events.customer_details_updated(this.customer_info);
			this.update_customer_section();
		});

		this.$cart_items_wrapper.html("");

		if (frm.doc.items.length) {
			frm.doc.items.forEach((item) => {
				this.update_item_html(item);
			});
		}

		// else if (storedItems) {
		// 	storedItems.forEach(item_data => {
		// 		this.update_item_html(item_data);
		// 	});

		// } 

		else {
			this.make_no_items_placeholder();
			this.highlight_checkout_btn(false);
		}

		this.update_totals_section(frm);

		if (frm.doc.docstatus === 1) {
			this.$totals_section.find(".checkout-btn").css("display", "none");
			this.$totals_section.find(".edit-cart-btn").css("display", "none");
		} else {
			this.$totals_section.find(".checkout-btn").css("display", "flex");
			this.$totals_section.find(".edit-cart-btn").css("display", "none");
		}

		this.toggle_component(true);
	}

	toggle_component(show) {
		show ? this.$component.css("display", "flex") : this.$component.css("display", "none");
	}
};