/* eslint-disable no-unused-vars */
custom_app.PointOfSale.Payment = class {
	constructor({ events, wrapper }) {
		this.wrapper = wrapper;
		this.events = events;
		this.init_component();
	}

	init_component() {
		this.prepare_dom();
		// this.initialize_numpad();
		this.bind_events();
		this.attach_shortcuts();
	}

	prepare_dom() {
		this.wrapper.append(
			`<section class="payment-container">
				<div class="section-label payment-section">${__("Payment Method")}</div>
				<div class="payment-modes"></div>
				<div class="fields-numpad-container">
					<div class="fields-section">
						<div class="section-label">${__("Additional Information")}</div>
						<div class="invoice-fields"></div>
					</div>
					<div class="number-pad"></div>
				</div>
				<div class="totals-section">
					<div class="totals"></div>
				</div>
				<div class="submit-order-btn">${__("Complete Order")}</div>
			</section>`
		);
		this.$component = this.wrapper.find(".payment-container");
		this.$payment_modes = this.$component.find(".payment-modes");
		this.$totals_section = this.$component.find(".totals-section");
		this.$totals = this.$component.find(".totals");
		this.$numpad = this.$component.find(".number-pad");
		this.$invoice_fields_section = this.$component.find(".fields-section");
	}

	make_invoice_fields_control() {
		frappe.db.get_doc("POS Settings", undefined).then((doc) => {
			const fields = doc.invoice_fields;
			if (!fields.length) return;

			this.$invoice_fields = this.$invoice_fields_section.find(".invoice-fields");
			this.$invoice_fields.html("");
			const frm = this.events.get_frm();

			fields.forEach((df) => {
				this.$invoice_fields.append(
					`<div class="invoice_detail_field ${df.fieldname}-field" data-fieldname="${df.fieldname}"></div>`
				);
				let df_events = {
					onchange: function () {
						frm.set_value(this.df.fieldname, this.get_value());
					},
				};
				if (df.fieldtype == "Button") {
					df_events = {
						click: function () {
							if (frm.script_manager.has_handlers(df.fieldname, frm.doc.doctype)) {
								frm.script_manager.trigger(df.fieldname, frm.doc.doctype, frm.doc.docname);
							}
						},
					};
				}

				this[`${df.fieldname}_field`] = frappe.ui.form.make_control({
					df: {
						...df,
						...df_events,
					},
					parent: this.$invoice_fields.find(`.${df.fieldname}-field`),
					render_input: true,
				});
				this[`${df.fieldname}_field`].set_value(frm.doc[df.fieldname]);
			});
		});
	}

	initialize_numpad() {
		const me = this;
		this.number_pad = new erpnext.PointOfSale.NumberPad({
			wrapper: this.$numpad,
			events: {
				numpad_event: function ($btn) {
					me.on_numpad_clicked($btn);
				},
			},
			cols: 3,
			keys: [
				[1, 2, 3],
				[4, 5, 6],
				[7, 8, 9],
				[".", 0, "Delete"],
			],
		});

		this.numpad_value = "";
	}

	on_numpad_clicked($btn) {
		const button_value = $btn.attr("data-button-value");

		highlight_numpad_btn($btn);
		this.numpad_value =
			button_value === "delete" ? this.numpad_value.slice(0, -1) : this.numpad_value + button_value;
		this.selected_mode.$input.get(0).focus();
		this.selected_mode.set_value(this.numpad_value);

		function highlight_numpad_btn($btn) {
			$btn.addClass("shadow-base-inner bg-selected");
			setTimeout(() => {
				$btn.removeClass("shadow-base-inner bg-selected");
			}, 100);
		}
	}
	
	bind_events() {
		const me = this;
	
		function hideAllFields() {
			$(`.mode-of-payment-control`).css("display", "none");
			$(`.mobile-number`).css("display", "none");
			$(`.approval-code`).css("display", "none");
			$(`.reference-number`).css("display", "none");
			$(`.bank-name`).css("display", "none");
			$(`.holder-name`).css("display", "none");
			$(`.card_type_control`).css("display", "none");
			$(`.card-number`).css("display", "none");
			$(`.expiry-date`).css("display", "none");
			$(`.confirmation-code`).css("display", "none");
			$(`.cash-shortcuts`).css("display", "none");
			$(`.check-name`).css("display", "none");
			$(`.check-number`).css("display", "none");
			$(`.check-date`).css("display", "none");
			$(`.actual-gov-one`).css("display", "none");
			$(`.actual-gov-two`).css("display", "none");
			$(`.payment-type`).css("display", "none");
			$(`.bank-type`).css("display", "none");
			$(`.qr-reference-number`).css("display", "none");
			$(`.customer`).css("display", "none");
			$(`.po-number`).css("display", "none");
			$(`.representative`).css("display", "none");
			$(`.id-number`).css("display", "none");
			$(`.approved-by`).css("display", "none");
			me.$payment_modes.find(`.pay-amount`).css("display", "inline");
			me.$payment_modes.find(`.loyalty-amount-name`).css("display", "none");
		}
		
		this.$payment_modes.on("click", ".mode-of-payment", function (e) {
			const mode_clicked = $(this);
			if (!$(e.target).is(mode_clicked)) return;

			const scrollLeft =
				mode_clicked.offset().left - me.$payment_modes.offset().left + me.$payment_modes.scrollLeft();
			me.$payment_modes.animate({ scrollLeft });
		
			const mode = mode_clicked.attr("data-mode");
		
			// Hide all fields first
			hideAllFields();
		
			// remove highlight from all mode-of-payments
			$(".mode-of-payment").removeClass("border-primary");
		
			if (mode_clicked.hasClass("border-primary")) {
				// clicked one is selected then unselect it
				mode_clicked.removeClass("border-primary");
				me.selected_mode = "";
			} else {
				// clicked one is not selected then select it
				mode_clicked.addClass("border-primary");
				mode_clicked.find(".mode-of-payment-control").css("display", "flex");
				mode_clicked.find(".mobile-number").css("display", "flex");
				mode_clicked.find(".reference-number").css("display", "flex");
				mode_clicked.find(".approval-code").css("display", "flex");
				mode_clicked.find(".bank-name").css("display", "flex");
				mode_clicked.find(".holder-name").css("display", "flex");
				mode_clicked.find(".card_type_control").css("display", "flex");
				mode_clicked.find(".card-number").css("display", "flex");
				mode_clicked.find(".expiry-date").css("display", "flex");
				mode_clicked.find(".confirmation-code").css("display", "flex");
				mode_clicked.find(".check-name").css("display", "flex");
				mode_clicked.find(".check-number").css("display", "flex");
				mode_clicked.find(".check-date").css("display", "flex");
				mode_clicked.find(".actual-gov-one").css("display", "flex");
				mode_clicked.find(".actual-gov-two").css("display", "flex");
				mode_clicked.find(".payment-type").css("display", "flex");
				mode_clicked.find(".bank-type").css("display", "flex");
				mode_clicked.find(".qr-reference-number").css("display", "flex");
				mode_clicked.find(".customer").css("display", "flex");
				mode_clicked.find(".po-number").css("display", "flex");
				mode_clicked.find(".representative").css("display", "flex");
				mode_clicked.find(".id-number").css("display", "flex");
				mode_clicked.find(".approved-by").css("display", "flex");
				mode_clicked.find(".cash-shortcuts").css("display", "grid");
				me.$payment_modes.find(`.${mode}-amount`).css("display", "none");
				me.$payment_modes.find(`.${mode}-name`).css("display", "inline");
				me.selected_mode = me[`${mode}_control`];
				me.selected_mode && me.selected_mode.$input.get().focus();
				me.auto_set_remaining_amount();
			}
		});
		
		// Hide all fields if clicking outside mode-of-payment
		$(document).on("click", function (e) {
			const target = $(e.target);
			if (!target.closest(".mode-of-payment").length) {
				hideAllFields();
				$(".mode-of-payment").removeClass("border-primary");
			}
		});


		
		
		frappe.ui.form.on("POS Invoice", "contact_mobile", (frm) => {
			const contact = frm.doc.contact_mobile;
			const request_button = $(this.request_for_payment_field?.$input[0]);
			if (contact) {
				request_button.removeClass("btn-default").addClass("btn-primary");
			} else {
				request_button.removeClass("btn-primary").addClass("btn-default");
			}
		});

		frappe.ui.form.on("POS Invoice", "coupon_code", (frm) => {
			if (frm.doc.coupon_code && !frm.applying_pos_coupon_code) {
				if (!frm.doc.ignore_pricing_rule) {
					frm.applying_pos_coupon_code = true;
					frappe.run_serially([
						() => (frm.doc.ignore_pricing_rule = 1),
						() => frm.trigger("ignore_pricing_rule"),
						() => (frm.doc.ignore_pricing_rule = 0),
						() => frm.trigger("apply_pricing_rule"),
						() => frm.save(),
						() => this.update_totals_section(frm.doc),
						() => (frm.applying_pos_coupon_code = false),
					]);
				} else if (frm.doc.ignore_pricing_rule) {
					frappe.show_alert({
						message: __("Ignore Pricing Rule is enabled. Cannot apply coupon code."),
						indicator: "orange",
					});
				}
			}
		});

		this.setup_listener_for_payments();

		this.$payment_modes.on("click", ".shortcut", function () {
			const value = $(this).attr("data-value");
			me.selected_mode.set_value(value);
		});

		this.$component.on("click", ".submit-order-btn", () => {
			const doc = this.events.get_frm().doc;
			const paid_amount = doc.paid_amount;
			const items = doc.items;

			if (paid_amount == 0 || !items.length) {
				const message = items.length
					? __("You cannot submit the order without payment.")
					: __("You cannot submit empty order.");
				frappe.show_alert({ message, indicator: "orange" });
				frappe.utils.play_sound("error");
				return;
			}

			this.events.submit_invoice();
		});

		frappe.ui.form.on("POS Invoice", "paid_amount", (frm) => {
			this.update_totals_section(frm.doc);
			// need to re calculate cash shortcuts after discount is applied
			const is_cash_shortcuts_invisible = !this.$payment_modes.find(".cash-shortcuts").is(":visible");
			this.attach_cash_shortcuts(frm.doc);
			!is_cash_shortcuts_invisible &&
				this.$payment_modes.find(".cash-shortcuts").css("display", "grid");
			this.render_payment_mode_dom();
		});

		frappe.ui.form.on("POS Invoice", "loyalty_amount", (frm) => {
			const formatted_currency = format_currency(frm.doc.loyalty_amount, frm.doc.currency);
			this.$payment_modes.find(`.loyalty-amount-amount`).html(formatted_currency);
		});

		frappe.ui.form.on("Sales Invoice Payment", "amount", (frm, cdt, cdn) => {
			// for setting correct amount after loyalty points are redeemed
			const default_mop = locals[cdt][cdn];
			const mode = default_mop.mode_of_payment.replace(/ +/g, "_").toLowerCase();
			if (this[`${mode}_control`] && this[`${mode}_control`].get_value() != default_mop.amount) {
				this[`${mode}_control`].set_value(default_mop.amount);
			}
		});
	}

	setup_listener_for_payments() {
		frappe.realtime.on("process_phone_payment", (data) => {
			const doc = this.events.get_frm().doc;
			const { response, amount, success, failure_message } = data;
			let message, title;

			if (success) {
				title = __("Payment Received");
				const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
					? doc.grand_total
					: doc.rounded_total;
				if (amount >= grand_total) {
					frappe.dom.unfreeze();
					message = __("Payment of {0} received successfully.", [
						format_currency(amount, doc.currency, 0),
					]);
					this.events.submit_invoice();
					cur_frm.reload_doc();
				} else {
					message = __(
						"Payment of {0} received successfully. Waiting for other requests to complete...",
						[format_currency(amount, doc.currency, 0)]
					);
				}
			} else if (failure_message) {
				message = failure_message;
				title = __("Payment Failed");
			}

			frappe.msgprint({ message: message, title: title });
		});
	}

	auto_set_remaining_amount() {
		const doc = this.events.get_frm().doc;
		const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
			? doc.grand_total
			: doc.rounded_total;
		const remaining_amount = grand_total - doc.paid_amount;
		const current_value = this.selected_mode ? this.selected_mode.get_value() : undefined;
		if (!current_value && remaining_amount > 0 && this.selected_mode) {
			this.selected_mode.set_value(remaining_amount);
		}
	}

	attach_shortcuts() {
		const ctrl_label = frappe.utils.is_mac() ? "⌘" : "Ctrl";
		this.$component.find(".submit-order-btn").attr("title", `${ctrl_label}+Enter`);
		frappe.ui.keys.on("ctrl+enter", () => {
			const payment_is_visible = this.$component.is(":visible");
			const active_mode = this.$payment_modes.find(".border-primary");
			if (payment_is_visible && active_mode.length) {
				this.$component.find(".submit-order-btn").click();
			}
		});

		frappe.ui.keys.add_shortcut({
			shortcut: "tab",
			action: () => {
				const payment_is_visible = this.$component.is(":visible");
				let active_mode = this.$payment_modes.find(".border-primary");
				active_mode = active_mode.length ? active_mode.attr("data-mode") : undefined;

				if (!active_mode) return;

				const mode_of_payments = Array.from(this.$payment_modes.find(".mode-of-payment")).map((m) =>
					$(m).attr("data-mode")
				);
				const mode_index = mode_of_payments.indexOf(active_mode);
				const next_mode_index = (mode_index + 1) % mode_of_payments.length;
				const next_mode_to_be_clicked = this.$payment_modes.find(
					`.mode-of-payment[data-mode="${mode_of_payments[next_mode_index]}"]`
				);

				if (payment_is_visible && mode_index != next_mode_index) {
					next_mode_to_be_clicked.click();
				}
			},
			condition: () =>
				this.$component.is(":visible") && this.$payment_modes.find(".border-primary").length,
			description: __("Switch Between Payment Modes"),
			ignore_inputs: true,
			page: cur_page.page.page,
		});
	}

	toggle_numpad() {
		// pass
	}

	render_payment_section() {
		this.render_payment_mode_dom();
		this.make_invoice_fields_control();
		this.update_totals_section();
		this.focus_on_default_mop();
	}

	after_render() {
		const frm = this.events.get_frm();
		frm.script_manager.trigger("after_payment_render", frm.doc.doctype, frm.doc.docname);
	}

	edit_cart() {
		this.events.toggle_other_sections(false);
		this.toggle_component(false);
	}

	checkout() {
		this.events.toggle_other_sections(true);
		this.toggle_component(true);
		this.render_payment_section();
		this.after_render();
	}

	toggle_remarks_control() {
		if (this.$remarks.find(".frappe-control").length) {
			this.$remarks.html("+ Add Remark");
		} else {
			this.$remarks.html("");
			this[`remark_control`] = frappe.ui.form.make_control({
				df: {
					label: __("Remark"),
					fieldtype: "Data",
					onchange: function () { },
				},
				parent: this.$totals_section.find(`.remarks`),
				render_input: true,
			});
			this[`remark_control`].set_value("");
		}
	}

	render_payment_mode_dom() {
		const doc = this.events.get_frm().doc;
		const payments = doc.payments;
		const currency = doc.currency;

		const customer_group = doc.customer_group;
		const allowed_payment_modes = ["2306", "2307"];

		this.$payment_modes.html(
			`${payments.map((p, i) => {
				const mode = p.mode_of_payment.replace(/ +/g, "_").toLowerCase();
				const payment_type = p.type;
				const margin = i % 2 === 0 ? "pr-2" : "pl-2";
				const amount = p.amount > 0 ? format_currency(p.amount, currency) : "";
	
				// Check if the customer group is 'Government' and if the payment mode is allowed
				// if (customer_group === "Government" && allowed_payment_modes.includes(p.mode_of_payment)) {
				// 	return ''; // Skip rendering this payment mode if the conditions are not met
				// }
	
				let paymentModeHtml = `
					<div class="payment-mode-wrapper ${margin}">
						<div class="mode-of-payment" data-mode="${mode}" data-payment-type="${payment_type}">
							${p.mode_of_payment}
							<div class="${mode}-amount pay-amount">${amount}</div>
							<div class="${mode} mode-of-payment-control"></div>
				`;
	
				switch (p.mode_of_payment) {
					case "GCash":
						paymentModeHtml += `
							<div class="${mode} mobile-number" style="margin-top:10px;"></div>
							<div class="${mode} reference-number" style="margin-top:10px;"></div>
						`;
						break;
	
					case "Cards":
						paymentModeHtml += `
							<div class="${mode} bank-name"></div>
							<div class="${mode} holder-name"></div>
							<div class="${mode} card_type_control"></div>
							<div class="${mode} card-number"></div>
							<div class="${mode} expiry-date"></div>
							<div class="${mode} approval-code"></div>
							<div class="${mode} reference-number"></div>
						`;
						break;
					case "Debit Card":
							paymentModeHtml += `
							<div class="${mode} bank-name"></div>
							<div class="${mode} holder-name"></div>
							<div class="${mode} card-number"></div>
							<div class="${mode} expiry-date"></div>
							<div class="${mode} approval-code"></div>
							<div class="${mode} reference-number"></div>
							`;
						break;
					case "Credit Card":
							paymentModeHtml += `
							<div class="${mode} bank-name"></div>
							<div class="${mode} holder-name"></div>
							<div class="${mode} card-number"></div>
							<div class="${mode} expiry-date"></div>
							<div class="${mode} approval-code"></div>
							<div class="${mode} reference-number"></div>
							`;
						break;
					case "PayMaya":
						paymentModeHtml += `
							<div class="${mode} mobile-number" style="margin-top:10px;"></div>
							<div class="${mode} reference-number" style="margin-top:10px;"></div>
						`;
						break;
					case "Cheque":
						paymentModeHtml += `
							<div class="${mode} bank-name"></div>
							<div class="${mode} check-name"></div>
							<div class="${mode} check-number"></div>
							<div class="${mode} check-date"></div>
						`;
						break;
					case "2306":
						paymentModeHtml += `
							<div class="${mode} actual-gov-one"></div>
						`;
						break;
					case "2307":
						paymentModeHtml += `
							<div class="${mode} actual-gov-two"></div>
						`;
						break;

					case "QR Payment": 
					 	paymentModeHtml += `
							<div class="${mode} payment-type"></div>
							<div class="${mode} bank-type"></div>
							<div class="${mode} qr-reference-number"></div>

						`;
						break;
					case "Charge": 
					 	paymentModeHtml += `
							<div class="${mode} customer"></div>
							<div class="${mode} po-number"></div>
							<div class="${mode} representative"></div>
							<div class="${mode} id-number"></div>
							<div class="${mode} approved-by"></div>
						`;
						break;
				}
	
				paymentModeHtml += `
						</div>
					</div>
				`;
	
				return paymentModeHtml;
			}).join("")}`
		);

		payments.forEach((p) => {
			const mode = p.mode_of_payment.replace(/ +/g, "_").toLowerCase();
			const me = this;
			// Define the allowed payment modes for the 'Government' customer group
			const allowed_payment_modes = ["2306", "2307"];
			// Check if the customer group is 'Government' and if the payment mode is allowed
			// if (customer_group === "Government" && allowed_payment_modes.includes(p.mode_of_payment)) {
			// 	return; // Skip this payment mode if the conditions are not met
			// }
	
			this[`${mode}_control`] = frappe.ui.form.make_control({
				df: {
					label: p.mode_of_payment,
					fieldtype: "Currency",
					placeholder: __("Enter {0} amount.", [p.mode_of_payment]),
					onchange: function () {
						const current_value = frappe.model.get_value(p.doctype, p.name, "amount");
						if (current_value != this.value) {
							frappe.model
								.set_value(p.doctype, p.name, "amount", flt(this.value))
								.then(() => me.update_totals_section());
							
							const formatted_currency = format_currency(this.value, currency);
							me.$payment_modes.find(`.${mode}-amount`).html(formatted_currency);
						}
					},
				},
				parent: this.$payment_modes.find(`.${mode}.mode-of-payment-control`),
				render_input: true,
			});

			this[`${mode}_control`].set_value(0);

			if (p.mode_of_payment === "Cards") {
				let existing_custom_bank_name = frappe.model.get_value(p.doctype, p.name, "custom_bank_name");

				// Create the bank_name_control with the existing value if it exists
				let bank_name_control = frappe.ui.form.make_control({
					df: {
						label: 'Bank',
						fieldtype: "Data",
						placeholder: 'Bank Name',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_bank_name", flt(this.value));
						},
					},
					parent: this.$payment_modes.find(`.${mode}.bank-name`),
					render_input: true,
				});

				// Set the existing value and refresh the control
				bank_name_control.set_value(existing_custom_bank_name || '');
				bank_name_control.refresh();



				let existing_custom_card_name = frappe.model.get_value(p.doctype, p.name, "custom_card_name");


				let name_on_card_control = frappe.ui.form.make_control({
					df: {
						label: 'Name on Card',
						fieldtype: "Data",
						placeholder: 'Card name holder',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_card_name", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.holder-name`),
					render_input: true,
				});

				// Set the existing value and refresh the control
				name_on_card_control.set_value(existing_custom_card_name || '');
				name_on_card_control.refresh();



				let existing_custom_card_type= frappe.model.get_value(p.doctype, p.name, "custom_card_type");

				// Card Type Control
				let card_type_control = frappe.ui.form.make_control({
					df: {
						label: 'Card Type',
						fieldtype: "Select",
						options: [
							{ label: 'Select Card Type', value: '' },
							{ label: 'Visa', value: 'Visa' },
							{ label: 'Visa Debit', value: 'Visa Debit' },
							{ label: 'Visa Electron', value: 'Visa Electron' },
							{ label: 'Credit Card', value: 'Credit Card' },
							{ label: 'Mastercard', value: 'Mastercard' },
							{ label: 'Mastercard Debit', value: 'Mastercard Debit' },
							{ label: 'Maestro', value: 'Maestro' },
							{ label: 'American Express (Amex)', value: 'American Express (Amex)' },
							{ label: 'Discover', value: 'Discover' },
							{ label: 'Diners Club', value: 'Diners Club' },
							{ label: 'JCB', value: 'JCB' },
							{ label: 'UnionPay', value: 'UnionPay' },
							{ label: 'RuPay', value: 'RuPay' },
							{ label: 'Interac', value: 'Interac' },
							{ label: 'Carte Bancaire (CB)', value: 'Carte Bancaire (CB)' },
							{ label: 'Elo', value: 'Elo' },
							{ label: 'Mir', value: 'Mir' },
							{ label: 'Others', value: 'Others' }
						],
						onchange: function () {
							const value = this.value;
							frappe.model.set_value(p.doctype, p.name, "custom_card_type", value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.card_type_control`),
					render_input: true,
				});
				card_type_control.set_value(existing_custom_card_type || '');
				card_type_control.refresh();


				let existing_custom_card_number = frappe.model.get_value(p.doctype, p.name, "custom_card_number");

				let card_number_control = frappe.ui.form.make_control({
					df: {
						label: 'Card Number',
						fieldtype: "Data",
						placeholder: 'Last 4 digits',
						onchange: function () {
							const value = this.value;
							if (value === '') {
								frappe.model.set_value(p.doctype, p.name, "custom_card_number", '');
							} else if (validateLastFourDigits(value)) {
								frappe.model.set_value(p.doctype, p.name, "custom_card_number", value);
							} else {
								frappe.msgprint(__('Card number must be exactly 4 digits.'));
								this.set_value('');
							}
						},
						maxlength: 4
					},
					parent: this.$payment_modes.find(`.${mode}.card-number`),
					render_input: true,
					default: existing_custom_card_number || ''
				});

				card_number_control.set_value(existing_custom_card_number || '');
				card_number_control.refresh();

				function validateLastFourDigits(value) {
					const regex = /^\d{4}$/;
					return regex.test(value);
				}


				let existing_custom_card_expiration_date= frappe.model.get_value(p.doctype, p.name, "custom_card_expiration_date");

				let expiry_date_control = frappe.ui.form.make_control({
					df: {
						label: 'Card Expiration Date',
						fieldtype: "Data",
						placeholder: 'MM/YY',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_card_expiration_date", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.expiry-date`),
					render_input: true,
					default: p.custom_card_expiration_date || ''
				});
				expiry_date_control.set_value(existing_custom_card_expiration_date || '');
				expiry_date_control.refresh();


				let existing_custom_approval_code = frappe.model.get_value(p.doctype, p.name, "custom_approval_code");


				let custom_approval_code_control = frappe.ui.form.make_control({
					df: {
						label: 'Approval Code',
						fieldtype: "Data",
						placeholder: 'Approval Code',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_approval_code", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.approval-code`),
					render_input: true,
				});

				// Set the existing value and refresh the control
				custom_approval_code_control.set_value(existing_custom_approval_code || '');
				custom_approval_code_control.refresh();


				let existing_reference_no= frappe.model.get_value(p.doctype, p.name, "reference_no");


				let reference_no_control = frappe.ui.form.make_control({
					df: {
						label: 'Reference No',
						fieldtype: "Data",
						placeholder: 'Reference No.',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "reference_no", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.reference-number`),
					render_input: true,
				});
				reference_no_control.set_value(existing_reference_no || '');
				reference_no_control.refresh();

			}

			if (p.mode_of_payment  === "GCash" || p.mode_of_payment  === 'PayMaya') {


				let existing_custom_phone_number = frappe.model.get_value(p.doctype, p.name, "custom_phone_number");

				let phone_number_control = frappe.ui.form.make_control({
					df: {
						label: 'Number',
						fieldtype: "Data",
						placeholder: '09876543212',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_phone_number", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.mobile-number`),
					render_input: true,
				});
				phone_number_control.set_value(existing_custom_phone_number || '');
				phone_number_control.refresh();



				let existing_custom_epayment_reference_number= frappe.model.get_value(p.doctype, p.name, "reference_no");

				let epayment_reference_number_controller= frappe.ui.form.make_control({
					df: {
						label: 'Reference No',
						fieldtype: "Data",
						placeholder: 'Reference No.',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "reference_no", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.reference-number`),
					render_input: true,
					default: p.reference_no || ''
				});

				epayment_reference_number_controller.set_value(existing_custom_epayment_reference_number || '');
				epayment_reference_number_controller.refresh();
			}


			if (p.mode_of_payment === "Debit Card" || p.mode_of_payment === "Credit Card") {
				let existing_custom_bank_name = frappe.model.get_value(p.doctype, p.name, "custom_bank_name");

				// Create the bank_name_control with the existing value if it exists
				let bank_name_control = frappe.ui.form.make_control({
					df: {
						label: 'Bank',
						fieldtype: "Data",
						placeholder: 'Bank Name',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_bank_name", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.bank-name`),
					render_input: true,
				});

				// Set the existing value and refresh the control
				bank_name_control.set_value(existing_custom_bank_name || '');
				bank_name_control.refresh();



				let existing_custom_card_name = frappe.model.get_value(p.doctype, p.name, "custom_card_name");


				let name_on_card_control = frappe.ui.form.make_control({
					df: {
						label: 'Name on Card',
						fieldtype: "Data",
						placeholder: 'Card name holder',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_card_name", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.holder-name`),
					render_input: true,
				});

				// Set the existing value and refresh the control
				name_on_card_control.set_value(existing_custom_card_name || '');
				name_on_card_control.refresh();



				let existing_custom_card_number = frappe.model.get_value(p.doctype, p.name, "custom_card_number");

				let card_number_control = frappe.ui.form.make_control({
					df: {
						label: 'Card Number',
						fieldtype: "Data",
						placeholder: 'Last 4 digits',
						onchange: function () {
							const value = this.value;
							if (value === '') {
								frappe.model.set_value(p.doctype, p.name, "custom_card_number", '');
							} else if (validateLastFourDigits(value)) {
								frappe.model.set_value(p.doctype, p.name, "custom_card_number", value);
							} else {
								frappe.msgprint(__('Card number must be exactly 4 digits.'));
								this.set_value('');
							}
						},
						maxlength: 4
					},
					parent: this.$payment_modes.find(`.${mode}.card-number`),
					render_input: true,
					default: existing_custom_card_number || ''
				});

				card_number_control.set_value(existing_custom_card_number || '');
				card_number_control.refresh();

				function validateLastFourDigits(value) {
					const regex = /^\d{4}$/;
					return regex.test(value);
				}


				let existing_custom_card_expiration_date= frappe.model.get_value(p.doctype, p.name, "custom_card_expiration_date");

				let expiry_date_control = frappe.ui.form.make_control({
					df: {
						label: 'Card Expiration Date',
						fieldtype: "Data",
						placeholder: 'MM/YY',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_card_expiration_date", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.expiry-date`),
					render_input: true,
					default: p.custom_card_expiration_date || ''
				});
				expiry_date_control.set_value(existing_custom_card_expiration_date || '');
				expiry_date_control.refresh();


				let existing_custom_approval_code = frappe.model.get_value(p.doctype, p.name, "custom_approval_code");
				let custom_approval_code_control = frappe.ui.form.make_control({
					df: {
						label: 'Approval Code',
						fieldtype: "Data",
						placeholder: 'Approval Code',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_approval_code", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.approval-code`),
					render_input: true,
				});

				// Set the existing value and refresh the control
				custom_approval_code_control.set_value(existing_custom_approval_code || '');
				custom_approval_code_control.refresh();




				let existing_reference_no= frappe.model.get_value(p.doctype, p.name, "reference_no");


				let reference_no_control = frappe.ui.form.make_control({
					df: {
						label: 'Reference No',
						fieldtype: "Data",
						placeholder: 'Reference No.',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "reference_no", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.reference-number`),
					render_input: true,
				});
				reference_no_control.set_value(existing_reference_no || '');
				reference_no_control.refresh();

			}

			if (p.mode_of_payment === "Cheque" || p.mode_of_payment  === 'Government') {

				let existing_custom_bank_name = frappe.model.get_value(p.doctype, p.name, "custom_check_bank_name");

				// Create the bank_name_control with the existing value if it exists
				let bank_name_control = frappe.ui.form.make_control({
					df: {
						label: 'Check Bank Name',
						fieldtype: "Data",
						placeholder: 'Check Bank Name',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_check_bank_name", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.bank-name`),
					render_input: true,
				});

				// Set the existing value and refresh the control
				bank_name_control.set_value(existing_custom_bank_name || '');
				bank_name_control.refresh();


				let existing_custom_check_name = frappe.model.get_value(p.doctype, p.name, "custom_name_on_check");
				let check_name_control = frappe.ui.form.make_control({
					df: {
						label: 'Name On Check',
						fieldtype: "Data",
						placeholder: 'Check Name',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_name_on_check", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.check-name`),
					render_input: true,
				});
				// Set the existing value and refresh the control
				check_name_control.set_value(existing_custom_check_name || '');
				check_name_control.refresh();
				

				let existing_custom_check_number = frappe.model.get_value(p.doctype, p.name, "custom_check_number");
				let check_number_control = frappe.ui.form.make_control({
					df: {
						label: 'Check Number',
						fieldtype: "Data",
						placeholder: 'Check Number',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_check_number", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.check-number`),
					render_input: true,
				});
				// Set the existing value and refresh the control
				check_number_control.set_value(existing_custom_check_number || '');
				check_number_control.refresh();

				let existing_custom_check_date = frappe.model.get_value(p.doctype, p.name, "custom_check_date");
				let check_date_control = frappe.ui.form.make_control({
					df: {
						fieldname: 'custom_check_date',
						label: 'Check Date',
						fieldtype: "Date",
						placeholder: 'Check Date',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_check_date", this.get_value());
						}
					},
					parent: this.$payment_modes.find(`.${mode}.check-date`),
					render_input: true
				});
				// Set the existing value and refresh the control
				check_date_control.set_value(existing_custom_check_date || frappe.datetime.nowdate());
				check_date_control.refresh();


			} 

			if (p.mode_of_payment === "2306") {
				// console.log('Form 2306 Expected: ', doc.custom_2306);
			
				
				let check_form_2306 = frappe.ui.form.make_control({
					df: {
						label: `Expected 2306 Amount`,
						fieldtype: "Currency",
						placeholder: 'Actual 2306',
						read_only: 1, // Set the field to read-only
					},
					parent: this.$payment_modes.find(`.${mode}.actual-gov-one`),
					render_input: true,
				});
			
				// Set the latest value of doc.custom_2306 directly
				let latest_form_2306_value = doc.custom_2306;
				frappe.model.set_value(p.doctype, p.name, "custom_form_2306", latest_form_2306_value);
			
				// Set the existing value and refresh the control
				check_form_2306.set_value(latest_form_2306_value || '');
				check_form_2306.refresh();
			}

			if (p.mode_of_payment === "2307") {

				
				let check_form_2307 = frappe.ui.form.make_control({
					df: {
						label: `Expected 2307 Amount`,
						fieldtype: "Currency",
						placeholder: 'Actual 2307',
						read_only: 1, // Set the field to read-only
					},
					parent: this.$payment_modes.find(`.${mode}.actual-gov-two`),
					render_input: true,
				});
				// Set the existing value and refresh the control
				let latest_form_2307_value = doc.custom_2307;
				frappe.model.set_value(p.doctype, p.name, "custom_form_2307", latest_form_2307_value);

				check_form_2307.set_value(latest_form_2307_value || '');
				check_form_2307.refresh();

			}

			if (p.mode_of_payment === "QR Payment") {

				let existing_custom_payment_type = frappe.model.get_value(p.doctype, p.name, "custom_payment_type");
				let custom_payment_type = frappe.ui.form.make_control({
					df: {
						label: 'Payment Type',
						fieldtype: "Select",
						options: [
							{ label: 'Select Payment Type', value: '' },
							{ label: 'Standee', value: 'Standee' },
							{ label: 'Terminal', value: 'Terminnal' },
						],
						onchange: function () {
							const value = this.value;
							frappe.model.set_value(p.doctype, p.name, "custom_payment_type", value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.payment-type`),
					render_input: true,
				});
				// Set the existing value and refresh the control
				custom_payment_type.set_value(existing_custom_payment_type || '');
				custom_payment_type.refresh();


				let existing_custom_bank_type = frappe.model.get_value(p.doctype, p.name, "custom_bank_type");
				let custom_bank_type = frappe.ui.form.make_control({
					df: {
						label: 'Bank',
						fieldtype: "Select",
						options: [
							{ label: 'Select Bank Type', value: '' },
							{ label: 'SBC', value: 'SBC' },
							{ label: 'MBTC', value: 'MBTC' },
							{ label: 'MAYA', value: 'MAYA' },
							{ label: 'BDO', value: 'BDO' },
						],
						onchange: function () {
							const value = this.value;
							frappe.model.set_value(p.doctype, p.name, "custom_bank_type", value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.bank-type`),
					render_input: true,
				});
				// Set the existing value and refresh the control
				custom_bank_type.set_value(existing_custom_bank_type || '');
				custom_bank_type.refresh();



				let existing_custom_qr_reference_number = frappe.model.get_value(p.doctype, p.name, "custom_qr_reference_number");
				let custom_qr_reference_number = frappe.ui.form.make_control({
					df: {
						label: `Confirmation Code`,
						fieldtype: "Data",
						placeholder: 'Reference # or Confirmation Code',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_qr_reference_number", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.qr-reference-number`),
					render_input: true,
				});
				custom_qr_reference_number.set_value(existing_custom_qr_reference_number || '');
				custom_qr_reference_number.refresh();

			}

	
			if (p.mode_of_payment === "Charge") {
				console.log('Mode of payment is Charge');
			
				let existing_custom_customer = frappe.model.get_value(p.doctype, p.name, "custom_customer");
				let custom_customer = frappe.ui.form.make_control({
					df: {
						label: 'Customer',
						fieldtype: "Data",
						placeholder: 'Customer Name',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_customer", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.customer`), // Use [0] to select the DOM element
					render_input: true,
				});
				custom_customer.set_value(existing_custom_customer || '');
				custom_customer.refresh();
			
				let existing_custom_po_number = frappe.model.get_value(p.doctype, p.name, "custom_po_number");
				let custom_po_number = frappe.ui.form.make_control({
					df: {
						label: 'PO Number',
						fieldtype: "Data", // Corrected fieldtype
						placeholder: 'PO Number',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_po_number", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.po-number`),
					render_input: true,
				});
				custom_po_number.set_value(existing_custom_po_number || '');
				custom_po_number.refresh();
			
				let existing_custom_representative = frappe.model.get_value(p.doctype, p.name, "custom_representative");
				let custom_representative = frappe.ui.form.make_control({
					df: {
						label: 'Representative',
						fieldtype: "Data", // Corrected fieldtype
						placeholder: 'Representative',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_representative", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.representative`),
					render_input: true,
				});
				custom_representative.set_value(existing_custom_representative || '');
				custom_representative.refresh();
			
				let existing_custom_id_number = frappe.model.get_value(p.doctype, p.name, "custom_id_number");
				let custom_id_number = frappe.ui.form.make_control({
					df: {
						label: 'ID Number',
						fieldtype: "Data", // Corrected fieldtype
						placeholder: 'ID Number',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_id_number", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.id-number`),
					render_input: true,
				});
				custom_id_number.set_value(existing_custom_id_number || '');
				custom_id_number.refresh();
			
				let existing_custom_approved_by = frappe.model.get_value(p.doctype, p.name, "custom_approved_by");
				let custom_approved_by = frappe.ui.form.make_control({
					df: {
						label: 'Approved By',
						fieldtype: "Data", // Corrected fieldtype
						placeholder: 'Approver name',
						onchange: function () {
							frappe.model.set_value(p.doctype, p.name, "custom_approved_by", this.value);
						},
					},
					parent: this.$payment_modes.find(`.${mode}.approved-by`),
					render_input: true,
				});
				custom_approved_by.set_value(existing_custom_approved_by || '');
				custom_approved_by.refresh();
			}




			this[`${mode}_control`].toggle_label(false);
			this[`${mode}_control`].set_value(p.amount);



		});
		this.render_loyalty_points_payment_mode();
		this.attach_cash_shortcuts(doc);



	}



	focus_on_default_mop() {
		const doc = this.events.get_frm().doc;
		const payments = doc.payments;
		payments.forEach((p) => {
			const mode = p.mode_of_payment.replace(/ +/g, "_").toLowerCase();
			if (p.default) {
				setTimeout(() => {
					this.$payment_modes.find(`.${mode}.mode-of-payment-control`).parent().click();
				}, 500);
			}
		});
	}

attach_cash_shortcuts(doc) {
		const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
			? doc.grand_total
			: doc.rounded_total;
		const currency = doc.currency;

		const shortcuts = this.get_cash_shortcuts(flt(grand_total));

		this.$payment_modes.find(".cash-shortcuts").remove();
		let shortcuts_html = shortcuts
			.map((s) => {
				return `<div class="shortcut" data-value="${s}">${format_currency(s, currency, 0)}</div>`;
			})
			.join("");

		this.$payment_modes
			.find('[data-payment-type="Cash"]')
			.find(".mode-of-payment-control")
			.after(`<div class="cash-shortcuts">${shortcuts_html}</div>`);
	}

	get_cash_shortcuts(grand_total) {
		let steps = [1, 5, 10];
		const digits = String(Math.round(grand_total)).length;
	
		steps = steps.map((x) => x * 10 ** (digits - 2));
	
		const get_nearest = (amount, x) => {
			let nearest_x = Math.ceil(amount / x) * x;
			return nearest_x === amount ? nearest_x + x : nearest_x;
		};
	
		let shortcuts = steps.reduce((finalArr, x) => {
			let nearest_x = get_nearest(grand_total, x);
			nearest_x = finalArr.indexOf(nearest_x) != -1 ? nearest_x + x : nearest_x;
			return [...finalArr, nearest_x];
		}, []);
	
		// Add 500 and 1000 if grand total is above 100
		if (grand_total > 100) {
			if (!shortcuts.includes(500)) {
				shortcuts.push(500);
			}
			if (!shortcuts.includes(1000)) {
				shortcuts.push(1000);
			}
		}
	
		// Sort shortcuts in ascending order
		shortcuts.sort((a, b) => a - b);
	
		return shortcuts;
	}


	render_loyalty_points_payment_mode() {
		const me = this;
		const doc = this.events.get_frm().doc;
		const { loyalty_program, loyalty_points, conversion_factor } = this.events.get_customer_details();

		this.$payment_modes.find(`.mode-of-payment[data-mode="loyalty-amount"]`).parent().remove();

		if (!loyalty_program) return;

		let description, read_only, max_redeemable_amount;
		if (!loyalty_points) {
			description = __("You don't have enough points to redeem.");
			read_only = true;
		} else {
			max_redeemable_amount = flt(
				flt(loyalty_points) * flt(conversion_factor),
				precision("loyalty_amount", doc)
			);
			description = __("You can redeem upto {0}.", [format_currency(max_redeemable_amount)]);
			read_only = false;
		}

		const margin = this.$payment_modes.children().length % 2 === 0 ? "pr-2" : "pl-2";
		const amount = doc.loyalty_amount > 0 ? format_currency(doc.loyalty_amount, doc.currency) : "";
		this.$payment_modes.append(
			`<div class="payment-mode-wrapper">
				<div class="mode-of-payment loyalty-card" data-mode="loyalty-amount" data-payment-type="loyalty-amount">
					Redeem Loyalty Points
					<div class="loyalty-amount-amount pay-amount">${amount}</div>
					<div class="loyalty-amount-name">${loyalty_program}</div>
					<div class="loyalty-amount mode-of-payment-control"></div>
				</div>
			</div>`
		);

		this["loyalty-amount_control"] = frappe.ui.form.make_control({
			df: {
				label: __("Redeem Loyalty Points"),
				fieldtype: "Currency",
				placeholder: __("Enter amount to be redeemed."),
				options: "company:currency",
				read_only,
				onchange: async function () {
					if (!loyalty_points) return;

					if (this.value > max_redeemable_amount) {
						frappe.show_alert({
							message: __("You cannot redeem more than {0}.", [
								format_currency(max_redeemable_amount),
							]),
							indicator: "red",
						});
						frappe.utils.play_sound("submit");
						me["loyalty-amount_control"].set_value(0);
						return;
					}
					const redeem_loyalty_points = this.value > 0 ? 1 : 0;
					await frappe.model.set_value(
						doc.doctype,
						doc.name,
						"redeem_loyalty_points",
						redeem_loyalty_points
					);
					frappe.model.set_value(
						doc.doctype,
						doc.name,
						"loyalty_points",
						parseInt(this.value / conversion_factor)
					);
				},
				description,
			},
			parent: this.$payment_modes.find(`.loyalty-amount.mode-of-payment-control`),
			render_input: true,
		});
		this["loyalty-amount_control"].toggle_label(false);

		// this.render_add_payment_method_dom();
	}

	render_add_payment_method_dom() {
		const docstatus = this.events.get_frm().doc.docstatus;
		if (docstatus === 0)
			this.$payment_modes.append(
				`<div class="w-full pr-2">
					<div class="add-mode-of-payment w-half text-grey mb-4 no-select pointer">+ Add Payment Method</div>
				</div>`
			);
	}

	update_totals_section(doc) {
		if (!doc) doc = this.events.get_frm().doc;
		const paid_amount = doc.paid_amount;
		const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
			? doc.grand_total
			: doc.rounded_total;
		const remaining = grand_total - doc.paid_amount;
		const change = doc.change_amount || remaining <= 0 ? -1 * remaining : undefined;
		const currency = doc.currency;
		const label = change ? __("Change") : __("To Be Paid");

		this.$totals.html(
			`<div class="col">
				<div class="total-label">${__("Grand Total")}</div>
				<div class="value">${format_currency(grand_total, currency)}</div>
			</div>
			<div class="seperator-y"></div>
			<div class="col">
				<div class="total-label">${__("Paid Amount")}</div>
				<div class="value">${format_currency(paid_amount, currency)}</div>
			</div>
			<div class="seperator-y"></div>
			<div class="col">
				<div class="total-label">${label}</div>
				<div class="value">${format_currency(change || remaining, currency)}</div>
			</div>`
		);
	}

	toggle_component(show) {
		show ? this.$component.css("display", "flex") : this.$component.css("display", "none");
	}
};