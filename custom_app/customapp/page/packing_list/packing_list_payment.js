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
			`<section class="payment-container" style="grid-column:span 4 / span 4;">
				<div class="fields-numpad-container">
					<div class="fields-section">
						<div class="section-label payment-section">${__("Payment Method")}</div>
						<div class="payment-modes"></div>
					</div>
				</div>
				<div class="totals-section">
					<div class="totals"></div>
				</div>
				<div class="submit-order-btn">${__("Print Order")}</div>
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
			$(`.mode-of-payment-control`).hide();
			$(`.mobile-number`).hide();
			$(`.approval-code`).hide();
			$(`.reference-number`).hide();
			$(`.bank-name`).hide();
			$(`.holder-name`).hide();
			$(`.card_type_control`).hide();
			$(`.card-number`).hide();
			$(`.expiry-date`).hide();
			$(`.confirmation-code`).hide();
			$(`.cash-shortcuts`).hide();
			$(`.check-name`).hide();
			$(`.check-number`).hide();
			$(`.check-date`).hide();
			$(`.actual-gov-one`).hide();
			$(`.actual-gov-two`).hide();
			$(`.payment-type`).hide();
			$(`.bank-type`).hide();
			$(`.qr-reference-number`).hide();
			$(`.customer`).hide();
			$(`.charge-invoice-number`).hide();
			$(`.po-number`).hide();
			$(`.representative`).hide();
			$(`.id-number`).hide();
			$(`.approved-by`).hide();
			$(`.gift-code`).hide();
			$(`.button-code`).hide();
			$(`.amesco-code`).hide();
			$(`.button-amesco-plus`).hide();
			$(`.save-button`).hide();
			$(`.discard-button`).hide();
			$(`.cash-button`).hide();
			me.$payment_modes.find(`.pay-amount`).css("display", "inline");
			me.$payment_modes.find(`.loyalty-amount-name`).hide();
		}


		function focusAndHighlightAmountField(mode_clicked) {
			const $amountField = mode_clicked.find(".frappe-control.input-max-width[data-fieldtype='Currency'] input");
			$amountField.focus();
			$amountField[0].setSelectionRange(0, $amountField.val().length);
		}


		this.$payment_modes.on("click", ".mode-of-payment", function (e) {
			const mode_clicked = $(this);
			if (!$(e.target).is(mode_clicked)) return;

			const scrollLeft = mode_clicked.offset().left - me.$payment_modes.offset().left + me.$payment_modes.scrollLeft();
			me.$payment_modes.animate({ scrollLeft });

			const mode = mode_clicked.attr("data-mode");

			// Hide all fields first
			hideAllFields();

			// Remove highlight from all mode-of-payments
			$(".mode-of-payment").removeClass("border-primary");

			if (mode_clicked.hasClass("border-primary")) {
				// Clicked one is selected then unselect it
				mode_clicked.removeClass("border-primary");
				hideAllFields();
			} else {
				// Clicked one is not selected then select it
				mode_clicked.addClass("border-primary");

				// Show relevant fields based on mode
				mode_clicked.find(".mode-of-payment-control").css("display", "flex");
				mode_clicked.find(".cash-button").css("display", "flex");
				if (mode === "gcash" || mode === "paymaya") {
					mode_clicked.find(".mobile-number").css("display", "flex");
					mode_clicked.find(".reference-number").css("display", "flex");
					mode_clicked.find(".save-button").css("display", "flex");
					mode_clicked.find(".discard-button").css("display", "flex");
				} else if (mode === "cards" || mode === "debit_card" || mode === "credit_card") {
					mode_clicked.find(".bank-name").css("display", "flex");
					mode_clicked.find(".holder-name").css("display", "flex");
					mode_clicked.find(".card_type_control").css("display", "flex");
					mode_clicked.find(".card-number").css("display", "flex");
					mode_clicked.find(".expiry-date").css("display", "flex");
					mode_clicked.find(".approval-code").css("display", "flex");
					mode_clicked.find(".save-button").css("display", "flex");
					mode_clicked.find(".discard-button").css("display", "flex");
				} else if (mode === "cheque") {
					mode_clicked.find(".bank-name").css("display", "flex");
					mode_clicked.find(".check-name").css("display", "flex");
					mode_clicked.find(".check-number").css("display", "flex");
					mode_clicked.find(".check-date").css("display", "flex");
					mode_clicked.find(".save-button").css("display", "flex");
					mode_clicked.find(".discard-button").css("display", "flex");
				} else if (mode === "2307g") {
					mode_clicked.find(".actual-gov-one").css("display", "flex");
					mode_clicked.find(".save-button").css("display", "flex");
					mode_clicked.find(".discard-button").css("display", "flex");
				} else if (mode === "2307") {
					mode_clicked.find(".actual-gov-two").css("display", "flex");
					mode_clicked.find(".save-button").css("display", "flex");
					mode_clicked.find(".discard-button").css("display", "flex");
				} else if (mode === "qr_payment") {
					mode_clicked.find(".payment-type").css("display", "flex");
					mode_clicked.find(".bank-type").css("display", "flex");
					mode_clicked.find(".qr-reference-number").css("display", "flex");
					mode_clicked.find(".save-button").css("display", "flex");
					mode_clicked.find(".discard-button").css("display", "flex");
				} else if (mode === "charge") {
					mode_clicked.find(".customer").css("display", "flex");
					mode_clicked.find(".charge-invoice-number").css("display", "flex");
					mode_clicked.find(".po-number").css("display", "flex");
					mode_clicked.find(".representative").css("display", "flex");
					mode_clicked.find(".id-number").css("display", "flex");
					mode_clicked.find(".approved-by").css("display", "flex");
					mode_clicked.find(".save-button").css("display", "flex");
					mode_clicked.find(".discard-button").css("display", "flex");
				} else if (mode === "gift_certificate") {
					mode_clicked.find(".gift-code").css("display", "flex");
					mode_clicked.find(".button-code").css("display", "flex");
					mode_clicked.find(".discard-button").css("display", "flex");
				} else if (mode === "amesco_plus") {
					mode_clicked.find(".amesco-code").css("display", "flex");
					mode_clicked.find(".button-amesco-plus").css("display", "flex");
					mode_clicked.find(".discard-button").css("display", "flex");
				} 
				focusAndHighlightAmountField(mode_clicked);
				// me.selected_mode = me[`${mode}_control`];
				me.selected_mode && me.selected_mode.$input.get();
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
			const paid_amount = parseFloat(doc.paid_amount).toFixed(2);  // Convert to 2 decimal places
			const items = doc.items;
			const payments = doc.payments;
			
			const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
				? parseFloat(doc.grand_total).toFixed(2)  // Convert to 2 decimal places
				: parseFloat(doc.rounded_total).toFixed(2);  // Convert to 2 decimal places
		
			console.log("GrandTotal", grand_total);
		
			// Validate that there are items and a non-zero paid amount
			if (paid_amount === 0 || !items.length) {
				const message = items.length
					? __("You cannot submit the order without payment.")
					: __("You cannot submit an empty order.");
				frappe.show_alert({ message, indicator: "orange" });
				frappe.utils.play_sound("error");
				return;
			}
		
			const total_paid_amount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

			// Round to 2 decimal places to avoid floating-point precision issues
			const rounded_total_paid = parseFloat(total_paid_amount).toFixed(2);
			const rounded_grand_total = parseFloat(grand_total).toFixed(2);

			const cash_payment_present = payments.some(p => p.mode_of_payment === 'Cash' || p.mode_of_payment === 'Gift Certificate' && p.amount > 0);

			// Compare the rounded values
			if (parseFloat(rounded_total_paid) > parseFloat(rounded_grand_total) && !cash_payment_present) {
				frappe.show_alert({
					message: __("Paid amount cannot be greater than the grand total for non-cash payments."),
					indicator: "orange"
				});
				frappe.utils.play_sound("error");
				return;
			}

		
			// If all checks pass, save as draft
			this.events.save_as_draft();
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

			// console.log(frm)
			// console.log(default_mop)

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
		const shift_label = frappe.utils.is_mac() ? "⌘" : "Shift";
		this.$component.find(".submit-order-btn").attr("title", `${shift_label}+Enter`);
	
		// Ctrl + Enter shortcut for submitting the order
		frappe.ui.keys.on("shift+enter", () => {
			const paymentMethodVisible = this.$component.find(".payment-section").is(":visible");
	
			// Only trigger the click if the payment method section is visible
			if (paymentMethodVisible) {
				this.$component.find(".submit-order-btn").click();
			}
		});
	
	

		frappe.ui.keys.add_shortcut({
			shortcut: "shift+tab",
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

			`<div style="display: flex; flex-wrap: wrap; gap: 16px;">
				${payments.map((p, i) => {
				const mode = p.mode_of_payment.replace(/ +/g, "_").toLowerCase();
				const payment_type = p.type;
				const amount = p.amount > 0 ? format_currency(p.amount, currency) : "";

				const displayStyle = (p.mode_of_payment === "2307G" && customer_group !== "Government") ? 'display: none;' : '';

				let paymentModeHtml = `
						<div class="payment-mode-wrapper" style="flex: 0 0 calc(50% - 16px); min-width: calc(50% - 16px); ${displayStyle}">
						<div class="mode-of-payment" data-mode="${mode}" data-payment-type="${payment_type}" style="border: 1px solid #ccc; border-radius: 8px; padding: 16px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); background-color: #fff;">
							 ${p.mode_of_payment}
							<div class="${mode}-amount pay-amount" style="font-weight: bold;">${amount}</div>
							<div class="${mode} mode-of-payment-control"></div>
							<div class="${mode} cash-button"></div>
					`;

				switch (p.mode_of_payment) {
					case "Cards":
					case "Debit Card":
					case "Credit Card":
						paymentModeHtml += `
								<div class="${mode} bank-name"></div>
								<div class="${mode} holder-name"></div>
								<div class="${mode} card_type_control"></div>
								<div class="${mode} card-number"></div>
								<div class="${mode} expiry-date"></div>
								<div class="${mode} approval-code"></div>
								<div class="${mode} button-row" style="display: flex; gap: 5px; align-items: center;">
									<div class="${mode} save-button"></div>
									<div class="${mode} discard-button"></div>
								</div>
							`;
						break;

					case "GCash":
					case "PayMaya":
						paymentModeHtml += `
								<div class="${mode} mobile-number" style="margin-top:10px;"></div>
								<div class="${mode} reference-number" style="margin-top:10px;"></div>
								<div class="${mode} button-row" style="display: flex; gap: 5px; align-items: center;">
									<div class="${mode} save-button"></div>
									<div class="${mode} discard-button"></div>
								</div>
							`;
						break;
					case "Cheque":
						paymentModeHtml += `
								<div class="${mode} bank-name"></div>
								<div class="${mode} check-name"></div>
								<div class="${mode} check-number"></div>
								<div class="${mode} check-date"></div>
								<div class="${mode} button-row" style="display: flex; gap: 5px; align-items: center;">
									<div class="${mode} save-button"></div>
									<div class="${mode} discard-button"></div>
								</div>
							`;
						break;
					case "2307G":
						paymentModeHtml += `
								<div class="${mode} actual-gov-one"></div>
								<div class="${mode} button-row" style="display: flex; gap: 5px; align-items: center;">
									<div class="${mode} save-button"></div>
									<div class="${mode} discard-button"></div>
								</div>
							`;
						break;
					case "2307":
						paymentModeHtml += `
								<div class="${mode} actual-gov-two"></div>
								<div class="${mode} button-row" style="display: flex; gap: 5px; align-items: center;">
									<div class="${mode} save-button"></div>
									<div class="${mode} discard-button"></div>
								</div>
							`;
						break;
					case "QR Payment":
						paymentModeHtml += `
								<div class="${mode} payment-type"></div>
								<div class="${mode} bank-type"></div>
								<div class="${mode} qr-reference-number"></div>
								<div class="${mode} button-row" style="display: flex; gap: 5px; align-items: center;">
									<div class="${mode} save-button"></div>
									<div class="${mode} discard-button"></div>
								</div>
							`;
						break;
					case "Charge":
						paymentModeHtml += `
								<div class="${mode} customer"></div>
								<div class="${mode} charge-invoice-number"></div>
								<div class="${mode} po-number"></div>
								<div class="${mode} representative"></div>
								<div class="${mode} id-number"></div>
								<div class="${mode} approved-by"></div>
								<div class="${mode} button-row" style="display: flex; gap: 5px; align-items: center;">
									<div class="${mode} save-button"></div>
									<div class="${mode} discard-button"></div>
								</div>
								
							`;
						break;
					case "Gift Certificate":
						paymentModeHtml += `
							  <div class="${mode} gift-code"></div>
							  <div class="${mode} button-row" style="display: flex; gap: 3px; align-items: center;">
							  		<div class="${mode} button-code mt-2" ></div>
									<div class="${mode} discard-button"></div>
								</div>
						   `;
						break;
					case "Amesco Plus":
						paymentModeHtml += `
							<div class="${mode} amesco-code"></div>
							<div class="${mode} button-row" style="display: flex; gap: 3px; align-items: center;">
								<div class="${mode} button-amesco-plus mt-2" ></div>
								<div class="${mode} discard-button"></div>
							</div>	
							
							   `;
						break;
				}

				paymentModeHtml += `
							</div>
						</div>
					`;

				return paymentModeHtml;
			}).join("")}
			</div>`
		);



		payments.forEach((p) => {
			const mode = p.mode_of_payment.replace(/ +/g, "_").toLowerCase();
			const me = this;
			const frm = this.events.get_frm()


			this[`${mode}_control`] = frappe.ui.form.make_control({
				df: {
					label: "Amount",
					fieldtype: "Currency",
					placeholder: __("Enter {0} amount.", [p.mode_of_payment]),
					read_only: (mode === "gift_certificate"),
					onchange: function () {
						const current_value = frappe.model.get_value(p.doctype, p.name, "amount");
						if (current_value != this.value) {
							// frappe.model
							// 	// .set_value(p.doctype, p.name, "amount", flt(this.value))
							// 	.then(() => me.update_totals_section());



							const formatted_currency = format_currency(this.value, currency);
							me.$payment_modes.find(`.${mode}-amount`).html(formatted_currency);
						}
					},
					reqd: true // Make the amount field required
				},
				parent: this.$payment_modes.find(`.${mode}.mode-of-payment-control`),
				render_input: true,
			});


			setTimeout(() => {
				const $amountField = this.$payment_modes.find(`.${mode}.mode-of-payment-control input[data-fieldname="amount"]`);
				$amountField.focus();
				$amountField.select(); // Selects the text inside the field for easy replacement
			}, 300); // Use a small delay to ensure the element is in the DOM

			// Add save and discard buttons for cash mode
			if (mode === "cash") {
				// Add save button
				const save_button = $('<button/>', {
					text: 'Save',
					class: 'btn btn-primary',
					click: function () {
						const amount_value = me[`${mode}_control`].get_value();

						if (!amount_value) {
							const dialog = frappe.msgprint({
								title: __('Validation Warning'),
								message: __('All fields are required.'),
								indicator: 'orange',
								primary_action: {
									label: __('OK'),
									action: function () {
										// Close the dialog
										frappe.msg_dialog.hide();

									}
								}
							});

							$(document).on('keydown', function (e) {
								if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
									dialog.get_primary_btn().trigger('click');
								}
							});

							// Remove event listener when dialog is closed
							dialog.$wrapper.on('hidden.bs.modal', function () {
								$(document).off('keydown');
							});


							return;
						}



						frappe.model
							.set_value(p.doctype, p.name, "amount", flt(amount_value))
							.then(() => {
								me.update_totals_section();
								const formatted_currency = format_currency(amount_value, currency);
								me.$payment_modes.find(`.${mode}-amount`).html(formatted_currency);

								const dialog = frappe.msgprint({
									title: __('Success'),
									message: __('Cash payment details have been saved.'),
									indicator: 'green',
									primary_action: {
										label: __('OK'),
										action: function () {
											// Close the dialog
											frappe.msg_dialog.hide();
										}
									}
								});

								// Add event listener for Enter key
								$(document).on('keydown', function (e) {
									if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
										dialog.get_primary_btn().trigger('click');
									}
								});

								// Remove event listener when dialog is closed
								dialog.$wrapper.on('hidden.bs.modal', function () {
									$(document).off('keydown');
								});
							});
					}
				});

				// Add discard button
				const discard_button = $('<button/>', {
					text: 'Discard',
					class: 'btn btn-secondary',
					click: function () {
						me[`${mode}_control`].set_value(0);
						frappe.model.set_value(p.doctype, p.name, "amount", 0).then(() => {
							me.update_totals_section();
							me.$payment_modes.find(`.${mode}-amount`).html(format_currency(0, currency));

							const dialog = frappe.msgprint({
								message: __('Cash payment details have been discarded.'),
								indicator: 'blue',
								primary_action: {
									label: __('OK'),
									action: function () {
										// Close the dialog
										frappe.msg_dialog.hide();
									}
								}
							});

							// Add event listener for Enter key
							$(document).on('keydown', function (e) {
								if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
									dialog.get_primary_btn().trigger('click');
								}
							});

							// Remove event listener when dialog is closed
							dialog.$wrapper.on('hidden.bs.modal', function () {
								$(document).off('keydown');
							});
						});
					}
				});

				// Append the save and discard buttons to the parent container
				const button_container = $('<div/>', { style: 'display: flex; gap: 5px; align-items: center;' });
				button_container.append(save_button);
				button_container.append(discard_button);
				this.$payment_modes.find(`.${mode}.cash-button`).append(button_container);

				// Add keypress event listener for Enter key to trigger save button click
				this.$payment_modes.find(`.${mode}.mode-of-payment-control input`).keypress(function (e) {
					if (e.which === 13) { // Enter key pressed
						save_button.click();
					}
				});

				this.$payment_modes.find(`.${mode}.mode-of-payment-control input`).keypress(function (e) {
					if (e.which === 8) { // Enter key pressed
						discard_button.click();
					}
				});
			}


			this[`${mode}_control`].set_value(0);

			if (p.mode_of_payment === "Cards") {

				let existing_custom_bank_name = frappe.model.get_value(p.doctype, p.name, "custom_bank_name");
				// Create the bank_name_control without onchange
				let bank_name_control = frappe.ui.form.make_control({
					df: {
						label: 'Bank',
						fieldtype: "Data",
						placeholder: 'Bank Name',
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.bank-name`),
					render_input: true,
				});
				bank_name_control.set_value(existing_custom_bank_name || '');
				bank_name_control.refresh();


				const selected_customer = cur_frm.doc.customer;

				let existing_custom_card_name = frappe.model.get_value(p.doctype, p.name, "custom_card_name");
				let name_on_card_control = frappe.ui.form.make_control({
					df: {
						label: 'Name on Card',
						fieldtype: "Data",
						placeholder: 'Card name holder',
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.holder-name`),
					render_input: true,
				});


				frappe.db.get_value('Customer', selected_customer, 'customer_name')
					.then(r => {
						const result = r.message.customer_name; // Extract the customer_name from the result
						name_on_card_control.set_value(existing_custom_card_name || result || '');
					})
					.catch(error => {
						console.error('Error fetching customer name:', error);
					});

				name_on_card_control.refresh();

				let existing_custom_card_type = frappe.model.get_value(p.doctype, p.name, "custom_card_type");
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
						reqd: true
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
						maxlength: 4,
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.card-number`),
					render_input: true,
				});
				card_number_control.set_value(existing_custom_card_number || '');
				card_number_control.refresh();

				let existing_custom_card_expiration_date = frappe.model.get_value(p.doctype, p.name, "custom_card_expiration_date");
		
				let expiry_date_control = frappe.ui.form.make_control({
					df: {
						label: 'Card Expiration Date',
						fieldtype: "Data",
						placeholder: 'MM/YY',
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.expiry-date`),
					render_input: true,
				});
				
				expiry_date_control.set_value(existing_custom_card_expiration_date || '');
				expiry_date_control.refresh();
				
				// Add event listener to automatically insert '/' after two digits
				expiry_date_control.$input.on('input', function () {
					let value = this.value.replace(/\D/g, ''); // Remove any non-digit characters
					if (value.length >= 2) {
						this.value = value.slice(0, 2) + '/' + value.slice(2); // Add '/' after the second digit
					} else {
						this.value = value; // Set the value directly if less than 2 digits
					}
				});

				let existing_custom_approval_code = frappe.model.get_value(p.doctype, p.name, "custom_approval_code");
				let custom_approval_code_control = frappe.ui.form.make_control({
					df: {
						label: 'Approval Code',
						fieldtype: "Data",
						placeholder: 'Approval Code',
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.approval-code`),
					render_input: true,
				});
				custom_approval_code_control.set_value(existing_custom_approval_code || '');
				custom_approval_code_control.refresh();

				// let existing_reference_no = frappe.model.get_value(p.doctype, p.name, "reference_no");
				// let reference_no_control = frappe.ui.form.make_control({
				// 	df: {
				// 		label: 'Reference No',
				// 		fieldtype: "Data",
				// 		placeholder: 'Reference No.',
				// 		reqd: true
				// 	},
				// 	parent: this.$payment_modes.find(`.${mode}.reference-number`),
				// 	render_input: true,
				// });
				// reference_no_control.set_value(existing_reference_no || '');
				// reference_no_control.refresh();

				// Create a save button for all the fields and append it under the reference control
				let save_button = $(`<button class="btn btn-primary"style="text-align: right;"">Save</button>`);
				this.$payment_modes.find(`.${mode}.save-button`).append(save_button);


				let discard_button = $('<button class="btn btn-secondary" style="text-align: right; margin-left: 10px;">Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);

				const me = this;
				// Attach an event listener to the save button
				save_button.on('click', function () {
					let amount = me[`${mode}_control`].get_value(); // Get amount value
					let bank_name = bank_name_control.get_value();
					let card_name = name_on_card_control.get_value();
					let card_type = card_type_control.get_value();
					let card_number = card_number_control.get_value();
					let card_expiry_date = expiry_date_control.get_value();
					let approval_code = custom_approval_code_control.get_value();
					// let reference_no = reference_no_control.get_value();

					if (!amount || !bank_name || !card_name || !card_type || !card_number || !card_expiry_date || !approval_code) {
						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('All fields are required.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});

						return;
					}

					if (!validateLastFourDigits(card_number)) {

						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('Card number must be exactly 4 digits.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});

						return;
					}

					const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
						? doc.grand_total
						: doc.rounded_total;
					const currency = doc.currency;

					if (amount > grand_total) {
						frappe.msgprint({
							title: __('Validation Warning'),
							message: __('Amount must not exceed the grand total.'),
							indicator: 'orange'
						});
						return;

					}


					frappe.model.set_value(p.doctype, p.name, "amount", flt(amount));
					frappe.model.set_value(p.doctype, p.name, "custom_bank_name", bank_name);
					frappe.model.set_value(p.doctype, p.name, "custom_card_name", card_name);
					frappe.model.set_value(p.doctype, p.name, "custom_card_type", card_type);
					frappe.model.set_value(p.doctype, p.name, "custom_card_number", card_number);
					frappe.model.set_value(p.doctype, p.name, "custom_card_expiration_date", card_expiry_date);
					frappe.model.set_value(p.doctype, p.name, "custom_approval_code", approval_code);
					// frappe.model.set_value(p.doctype, p.name, "reference_no", reference_no);

					const dialog = frappe.msgprint({
						title: __('Success'),
						message: __('Card payment details have been saved.'),
						indicator: 'green',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});


					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});


				});

				discard_button.on('click', function () {
					// Clear all the fields
					this[`${mode}_control`].set_value(0);
					bank_name_control.set_value('');
					name_on_card_control.set_value('');
					card_type_control.set_value('');
					card_number_control.set_value('');
					expiry_date_control.set_value('');
					custom_approval_code_control.set_value('');


					// Set values in the model to null or empty string
					frappe.model.set_value(p.doctype, p.name, "amount", 0);
					frappe.model.set_value(p.doctype, p.name, "custom_bank_name", '');
					frappe.model.set_value(p.doctype, p.name, "custom_card_name", '');
					frappe.model.set_value(p.doctype, p.name, "custom_card_type", '');
					frappe.model.set_value(p.doctype, p.name, "custom_card_number", '');
					frappe.model.set_value(p.doctype, p.name, "custom_card_expiration_date", '');
					frappe.model.set_value(p.doctype, p.name, "custom_approval_code", '');

					frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});
				});

				const controls = [
					me[`${mode}_control`],
					bank_name_control,
					name_on_card_control,
					card_type_control,
					card_number_control,
					expiry_date_control,
					custom_approval_code_control
				]

				controls.forEach(control => {
					control.$input && control.$input.keypress(function (e) {
						if (e.which === 13) { // Enter key pressed
							save_button.click();
						}
					});
				});



				function validateLastFourDigits(value) {
					const regex = /^\d{4}$/;
					return regex.test(value);
				}
			}

			if (p.mode_of_payment === "GCash" || p.mode_of_payment === 'PayMaya') {

				let existing_custom_phone_number = frappe.model.get_value(p.doctype, p.name, "custom_phone_number");
				let phone_number_control = frappe.ui.form.make_control({
					df: {
						label: 'Number',
						fieldtype: "Data",
						placeholder: '09876543212',

						// onchange: function () {
						// 	frappe.model.set_value(p.doctype, p.name, "custom_phone_number", this.value);
						// },
					},
					parent: this.$payment_modes.find(`.${mode}.mobile-number`),
					render_input: true,
				});
				phone_number_control.set_value(existing_custom_phone_number || '');
				phone_number_control.refresh();



				let existing_custom_epayment_reference_number = frappe.model.get_value(p.doctype, p.name, "reference_no");

				let epayment_reference_number_controller = frappe.ui.form.make_control({
					df: {
						label: 'Reference No',
						fieldtype: "Data",
						placeholder: 'Reference No.',

						// onchange: function () {
						// 	frappe.model.set_value(p.doctype, p.name, "reference_no", this.value);
						// },
					},
					parent: this.$payment_modes.find(`.${mode}.reference-number`),
					render_input: true,
					default: p.reference_no || ''
				});

				epayment_reference_number_controller.set_value(existing_custom_epayment_reference_number || '');
				epayment_reference_number_controller.refresh();



				let save_button = $('<button class="btn btn-primary" style="text-align: right;">save</button>');
				this.$payment_modes.find(`.${mode}.save-button`).append(save_button);

				// Create discard button
				let discard_button = $('<button class="btn btn-secondary" style="text-align: right; margin-left: 10px;">Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);

				const me = this;

				// Attach event listener to the save button
				save_button.on('click', function () {
					let amount = me[`${mode}_control`].get_value(); // Get amount value
					let phone_number = phone_number_control.get_value();
					let reference_no = epayment_reference_number_controller.get_value();


					if (!amount) {
						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('All fields are required.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;
					}

					const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
						? doc.grand_total
						: doc.rounded_total;
					const currency = doc.currency;


					if (amount > grand_total) {

						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('Amount must not exceed the grand total.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;

					}

					frappe.model.set_value(p.doctype, p.name, "amount", flt(amount));
					frappe.model.set_value(p.doctype, p.name, "custom_phone_number", phone_number);
					frappe.model.set_value(p.doctype, p.name, "reference_no", reference_no);

					const dialog = frappe.msgprint({
						title: __('Success'),
						message: __('Payment details have been saved.'),
						indicator: 'green',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});

				});

				// Attach event listener to the discard button
				discard_button.on('click', function () {
					// Clear all the fields
					me[`${mode}_control`].set_value(0);
					phone_number_control.set_value('');
					epayment_reference_number_controller.set_value('');

					// Set values in the model to null or empty string
					frappe.model.set_value(p.doctype, p.name, "amount", 0);
					frappe.model.set_value(p.doctype, p.name, "custom_phone_number", '');
					frappe.model.set_value(p.doctype, p.name, "reference_no", '');

					frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});
				});

				const controls = [
					me[`${mode}_control`],
					phone_number_control,
					epayment_reference_number_controller,
				];

				controls.forEach(control => {
					control.$input && control.$input.keypress(function (e) {
						if (e.which === 13) { // Enter key pressed
							save_button.click();
						}
					});
				});


			}


			if (p.mode_of_payment === "Debit Card" || p.mode_of_payment === "Credit Card") {
				// Retrieve existing values
				let existing_custom_bank_name = frappe.model.get_value(p.doctype, p.name, "custom_bank_name");
				let existing_custom_card_name = frappe.model.get_value(p.doctype, p.name, "custom_card_name");
				let existing_custom_card_type = frappe.model.get_value(p.doctype, p.name, "custom_card_type");
				let existing_custom_card_number = frappe.model.get_value(p.doctype, p.name, "custom_card_number");
				let existing_custom_card_expiration_date = frappe.model.get_value(p.doctype, p.name, "custom_card_expiration_date");
				let existing_custom_approval_code = frappe.model.get_value(p.doctype, p.name, "custom_approval_code");
		
				// Create controls
				let bank_name_control = frappe.ui.form.make_control({
					df: {
						label: 'Bank',
						fieldtype: "Data",
						placeholder: 'Bank Name',
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.bank-name`),
					render_input: true,
				});
				bank_name_control.set_value(existing_custom_bank_name || '');
				bank_name_control.refresh();



				const selected_customer = cur_frm.doc.customer;
				let name_on_card_control = frappe.ui.form.make_control({
					df: {
						label: 'Name on Card',
						fieldtype: "Data",
						placeholder: 'Card name holder',
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.holder-name`), // Ensure mode is defined and correct
					render_input: true,
				});

				// Fetch the customer name and set it to the control when available
				frappe.db.get_value('Customer', selected_customer, 'customer_name')
					.then(r => {
						const result = r.message.customer_name; // Extract the customer_name from the result
						name_on_card_control.set_value(existing_custom_card_name || result || '');
					})
					.catch(error => {
						console.error('Error fetching customer name:', error);
					});

				// Refresh the control to render it properly
				name_on_card_control.refresh();

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
					},
					parent: this.$payment_modes.find(`.${mode}.card_type_control`),
					render_input: true,
				});
				card_type_control.set_value(existing_custom_card_type || '');
				card_type_control.refresh();



				let card_number_control = frappe.ui.form.make_control({
					df: {
						label: 'Card Number',
						fieldtype: "Data",
						placeholder: 'Last 4 digits',
						maxlength: 4,
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.card-number`),
					render_input: true,
				});
				card_number_control.set_value(existing_custom_card_number || '');
				card_number_control.refresh();

				let expiry_date_control = frappe.ui.form.make_control({
					df: {
						label: 'Card Expiration Date',
						fieldtype: "Data",
						placeholder: 'MM/YY',
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.expiry-date`),
					render_input: true,
				});
				
				expiry_date_control.set_value(existing_custom_card_expiration_date || '');
				expiry_date_control.refresh();
				
				// Add event listener to automatically insert '/' after two digits
				expiry_date_control.$input.on('input', function () {
					let value = this.value.replace(/\D/g, ''); // Remove any non-digit characters
					if (value.length >= 2) {
						this.value = value.slice(0, 2) + '/' + value.slice(2); // Add '/' after the second digit
					} else {
						this.value = value; // Set the value directly if less than 2 digits
					}
				});

				let custom_approval_code_control = frappe.ui.form.make_control({
					df: {
						label: 'Approval Code',
						fieldtype: "Data",
						placeholder: 'Approval Code',
					},
					parent: this.$payment_modes.find(`.${mode}.approval-code`),
					render_input: true,
				});
				custom_approval_code_control.set_value(existing_custom_approval_code || '');
				custom_approval_code_control.refresh();




				let save_button = $('<button class="btn btn-primary" style="text-align: right;">Save</button>');
				this.$payment_modes.find(`.${mode}.save-button`).append(save_button);

				// Create discard button
				let discard_button = $('<button class="btn btn-secondary" style="text-align: right; margin-left: 10px;">Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);

				const me = this;

				// Attach event listener to the save button
				save_button.on('click', function () {
					let amount = me[`${mode}_control`].get_value(); // Get amount value
					let bank_name = bank_name_control.get_value();
					let card_name = name_on_card_control.get_value();
					let card_type = card_type_control.get_value();
					let card_number = card_number_control.get_value();
					let card_expiry_date = expiry_date_control.get_value();
					let approval_code = custom_approval_code_control.get_value();

					if  (!amount || !bank_name || !card_name || !card_number || !card_expiry_date)  {
						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('All fields are required.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;
					}

					if (!validateLastFourDigits(card_number)) {

						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('Card number must be exactly 4 digits.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;
					}


					const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
						? doc.grand_total
						: doc.rounded_total;
					const currency = doc.currency;


					if (amount > grand_total) {
						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('Amount must not exceed the grand total.'),
							indicator: 'orange'
						});


						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;

					}

					frappe.model.set_value(p.doctype, p.name, "amount", flt(amount));
					frappe.model.set_value(p.doctype, p.name, "custom_bank_name", bank_name);
					frappe.model.set_value(p.doctype, p.name, "custom_card_name", card_name);
					frappe.model.set_value(p.doctype, p.name, "custom_card_type", card_type);
					frappe.model.set_value(p.doctype, p.name, "custom_card_number", card_number);
					frappe.model.set_value(p.doctype, p.name, "custom_card_expiration_date", card_expiry_date);
					frappe.model.set_value(p.doctype, p.name, "custom_approval_code", approval_code);

					const dialog = frappe.msgprint({
						title: __('Success'),
						message: __('Card payment details have been saved.'),
						indicator: 'green',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});


				});

				// Attach event listener to the discard button
				discard_button.on('click', function () {
					// Clear all the fields
					me[`${mode}_control`].set_value(0);
					bank_name_control.set_value('');
					name_on_card_control.set_value('');
					card_number_control.set_value('');
					expiry_date_control.set_value('');
					custom_approval_code_control.set_value('');

					// Set values in the model to null or empty string
					frappe.model.set_value(p.doctype, p.name, "amount", 0);
					frappe.model.set_value(p.doctype, p.name, "custom_bank_name", '');
					frappe.model.set_value(p.doctype, p.name, "custom_card_name", '');
					frappe.model.set_value(p.doctype, p.name, "custom_card_number", '');
					frappe.model.set_value(p.doctype, p.name, "custom_card_expiration_date", '');
					frappe.model.set_value(p.doctype, p.name, "custom_approval_code", '');

					const dialog = frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});


					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});

				});

				function validateLastFourDigits(value) {
					const regex = /^\d{4}$/;
					return regex.test(value);
				}

				const controls = [
					me[`${mode}_control`],
					bank_name_control,
					name_on_card_control,
					card_number_control,
					expiry_date_control,
					custom_approval_code_control
				];

				controls.forEach(control => {
					control.$input && control.$input.keypress(function (e) {
						if (e.which === 13) { // Enter key pressed
							save_button.click();
						}
					});
				});

			}


			if (p.mode_of_payment === "Cheque" || p.mode_of_payment === 'Government') {

				let existing_custom_bank_name = frappe.model.get_value(p.doctype, p.name, "custom_check_bank_name");

				// Create the bank_name_control with the existing value if it exists
				let bank_name_control = frappe.ui.form.make_control({
					df: {
						label: 'Bank Of Cheque',
						fieldtype: "Data",
						placeholder: 'Bank Of Cheque',
						reqd: true

						// onchange: function () {
						// 	frappe.model.set_value(p.doctype, p.name, "custom_check_bank_name", this.value);
						// },
					},
					parent: this.$payment_modes.find(`.${mode}.bank-name`),
					render_input: true,
				});

				// Set the existing value and refresh the control
				bank_name_control.set_value(existing_custom_bank_name || '');
				bank_name_control.refresh();


				const selected_customer = cur_frm.doc.customer;

				let existing_custom_check_name = frappe.model.get_value(p.doctype, p.name, "custom_name_on_check");
				let check_name_control = frappe.ui.form.make_control({
					df: {
						label: 'Name On Cheque',
						fieldtype: "Data",
						placeholder: 'Cheque Name',
						reqd: true
						// onchange: function () {
						// 	frappe.model.set_value(p.doctype, p.name, "custom_name_on_check", this.value);
						// },
					},
					parent: this.$payment_modes.find(`.${mode}.check-name`),
					render_input: true,
				});
				// Set the existing value and refresh the control
				frappe.db.get_value('Customer', selected_customer, 'customer_name')
					.then(r => {
						const result = r.message.customer_name; // Extract the customer_name from the result
						check_name_control.set_value(existing_custom_check_name || result || '');
					})
					.catch(error => {
						console.error('Error fetching customer name:', error);
					});
		
				check_name_control.refresh();


				let existing_custom_check_number = frappe.model.get_value(p.doctype, p.name, "custom_check_number");
				let check_number_control = frappe.ui.form.make_control({
					df: {
						label: 'Cheque Number',
						fieldtype: "Data",
						placeholder: 'Cheque Number',
						reqd: true
						// onchange: function () {
						// 	frappe.model.set_value(p.doctype, p.name, "custom_check_number", this.value);
						// },
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
						label: 'Cheque Date',
						fieldtype: "Date",
						placeholder: 'Cheque Date',
						reqd: true
						// onchange: function () {
						// 	frappe.model.set_value(p.doctype, p.name, "custom_check_date", this.get_value());
						// }
					},
					parent: this.$payment_modes.find(`.${mode}.check-date`),
					render_input: true
				});
				// Set the existing value and refresh the control
				check_date_control.set_value(existing_custom_check_date || frappe.datetime.nowdate());
				check_date_control.refresh();

				let save_button = $(`<button class="btn btn-primary"style="text-align: right;"">Save</button>`);
				this.$payment_modes.find(`.${mode}.save-button`).append(save_button);

				let discard_button = $('<button class="btn btn-secondary" style="text-align: right; margin-left: 10px;">Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);

				const me = this;
				// Attach an event listener to the save button
				save_button.on('click', function () {
					let amount = me[`${mode}_control`].get_value(); // Get amount value
					let bank_name = bank_name_control.get_value();
					let check_name = check_name_control.get_value();
					let check_number = check_number_control.get_value();
					let check_date = check_date_control.get_value();
					// let reference_no = reference_no_control.get_value();

					if (!amount || !bank_name || !check_name || !check_number || !check_date) {
						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('All fields are required.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;
					}

					const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
						? doc.grand_total
						: doc.rounded_total;
					const currency = doc.currency;


					if (amount > grand_total) {

						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('Amount must not exceed the grand total.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;

					}


					frappe.model.set_value(p.doctype, p.name, "amount", flt(amount));
					frappe.model.set_value(p.doctype, p.name, "custom_check_bank_name", bank_name);
					frappe.model.set_value(p.doctype, p.name, "custom_name_on_check", check_name);
					frappe.model.set_value(p.doctype, p.name, "custom_check_number", check_number);
					frappe.model.set_value(p.doctype, p.name, "custom_check_date", check_date);
					// frappe.model.set_value(p.doctype, p.name, "reference_no", reference_no);




					const dialog = frappe.msgprint({
						title: __('Success'),
						message: __('Cheque payment details have been saved.'),
						indicator: 'green',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});

				});


				discard_button.on('click', function () {
					me[`${mode}_control`].set_value(0);
					bank_name_control.set_value('');
					check_name_control.set_value('');
					check_number_control.set_value('');
					check_date_control.set_value('');
					// let reference_no = reference_no_control.get_value();


					frappe.model.set_value(p.doctype, p.name, "amount", 0);
					frappe.model.set_value(p.doctype, p.name, "custom_check_bank_name", '');
					frappe.model.set_value(p.doctype, p.name, "custom_name_on_check", '');
					frappe.model.set_value(p.doctype, p.name, "custom_check_number", '');
					frappe.model.set_value(p.doctype, p.name, "custom_check_date", '');
					// frappe.model.set_value(p.doctype, p.name, "reference_no", reference_no);

					const dialog = frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});

				});


				const controls = [
					me[`${mode}_control`],
					bank_name_control,
					check_name_control,
					check_number_control,
					check_date_control,
				];

				controls.forEach(control => {
					control.$input && control.$input.keypress(function (e) {
						if (e.which === 13) { // Enter key pressed
							save_button.click();
						}
					});
				});


			}


			if (p.mode_of_payment === "2307G") {
				// console.log('Form 2306 Expected: ', doc.custom_2306);


				let check_form_2306 = frappe.ui.form.make_control({
					df: {
						label: `Expected 2307G Amount`,
						fieldtype: "Currency",
						placeholder: 'Actual 2307G',
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


				let save_button = $(`<button class="btn btn-primary"style="text-align: right;"">Save</button>`);
				this.$payment_modes.find(`.${mode}.save-button`).append(save_button);

				let discard_button = $('<button class="btn btn-secondary" style="text-align: right; margin-left: 10px;">Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);

				const me = this;
				// Attach an event listener to the save button
				save_button.on('click', function () {
					let amount = me[`${mode}_control`].get_value(); // Get amount value

					if (!amount) {
						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('All fields are required.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;
					}



					frappe.model.set_value(p.doctype, p.name, "amount", flt(amount));

					const dialog = frappe.msgprint({
						title: __('Success'),
						message: __('Payment details have been saved.'),
						indicator: 'green',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});


					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});


				});


				discard_button.on('click', function () {
					me[`${mode}_control`].set_value('');
					frappe.model.set_value(p.doctype, p.name, "amount", 0);

					const dialog = frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});

				});


				const controls = [
					me[`${mode}_control`],
				];

				controls.forEach(control => {
					control.$input && control.$input.keypress(function (e) {
						if (e.which === 13) { // Enter key pressed
							save_button.click();
						}
					});
				});


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



				let save_button = $(`<button class="btn btn-primary"style="text-align: right;"">Save</button>`);
				this.$payment_modes.find(`.${mode}.save-button`).append(save_button);

				let discard_button = $('<button class="btn btn-secondary" style="text-align: right; margin-left: 10px;">Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);

				const me = this;
				// Attach an event listener to the save button
				save_button.on('click', function () {
					let amount = me[`${mode}_control`].get_value(); // Get amount value

					if (!amount) {
						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('All fields are required.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;
					}

					frappe.model.set_value(p.doctype, p.name, "amount", flt(amount));

					const dialog = frappe.msgprint({
						title: __('Success'),
						message: __('Payment details have been saved.'),
						indicator: 'green',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});
				});


				discard_button.on('click', function () {
					me[`${mode}_control`].set_value('');
					frappe.model.set_value(p.doctype, p.name, "amount", 0);

					const dialog = frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});

				});

				const controls = [
					me[`${mode}_control`],
				];

				controls.forEach(control => {
					control.$input && control.$input.keypress(function (e) {
						if (e.which === 13) { // Enter key pressed
							save_button.click();
						}
					});
				});



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
							{ label: 'Terminal', value: 'Terminal' },
						],
						reqd: true
						// onchange: function () {
						// 	const value = this.value;
						// 	frappe.model.set_value(p.doctype, p.name, "custom_payment_type", value);
						// },
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
							{ label: 'GCASH', value: 'GCASH' },
							{ label: 'BDO', value: 'BDO' },
						],
						reqd: true
						// onchange: function () {
						// 	const value = this.value;
						// 	frappe.model.set_value(p.doctype, p.name, "custom_bank_type", value);
						// },
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
					

						// onchange: function () {
						// 	frappe.model.set_value(p.doctype, p.name, "custom_qr_reference_number", this.value);
						// },
					},
					parent: this.$payment_modes.find(`.${mode}.qr-reference-number`),
					render_input: true,
				});
				custom_qr_reference_number.set_value(existing_custom_qr_reference_number || '');
				custom_qr_reference_number.refresh();


				let save_button = $(`<button class="btn btn-primary"style="text-align: right;"">Save</button>`);
				this.$payment_modes.find(`.${mode}.save-button`).append(save_button);

				let discard_button = $('<button class="btn btn-secondary" style="text-align: right; margin-left: 10px;">Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);

				const me = this;
				// Attach an event listener to the save button
				save_button.on('click', function () {
					let amount = me[`${mode}_control`].get_value(); // Get amount value
					let payment_type = custom_payment_type.get_value();
					let bank_type = custom_bank_type.get_value();
					let qr_reference_number = custom_qr_reference_number.get_value();

					// let reference_no = reference_no_control.get_value();

					if (!amount || !payment_type || !bank_type) {
						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('All fields are required.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;
					}


					const grand_total = cint(frappe.sys_defaults.disable_rounded_total)
						? doc.grand_total
						: doc.rounded_total;
					const currency = doc.currency;

					if (amount > grand_total) {

						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('Amount must not exceed the grand total.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;

					}


					frappe.model.set_value(p.doctype, p.name, "amount", flt(amount));
					frappe.model.set_value(p.doctype, p.name, "custom_payment_type", payment_type);
					frappe.model.set_value(p.doctype, p.name, "custom_bank_type", bank_type);
					frappe.model.set_value(p.doctype, p.name, "custom_qr_reference_number", qr_reference_number);
					// frappe.model.set_value(p.doctype, p.name, "reference_no", reference_no);

					const dialog = frappe.msgprint({
						title: __('Success'),
						message: __('Payment details have been saved.'),
						indicator: 'green',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});
				});


				discard_button.on('click', function () {
					me[`${mode}_control`].set_value(0);
					custom_payment_type.set_value('');
					custom_bank_type.set_value('');
					custom_qr_reference_number.set_value('');
					// let reference_no = reference_no_control.get_value();


					frappe.model.set_value(p.doctype, p.name, "amount", 0);
					frappe.model.set_value(p.doctype, p.name, "custom_payment_type", '');
					frappe.model.set_value(p.doctype, p.name, "custom_bank_type", '');
					frappe.model.set_value(p.doctype, p.name, "custom_qr_reference_number", '');
					// frappe.model.set_value(p.doctype, p.name, "reference_no", reference_no);

					const dialog = frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});

				});

				const controls = [
					me[`${mode}_control`],
					custom_payment_type,
					custom_bank_type,
					custom_qr_reference_number,
				];

				controls.forEach(control => {
					control.$input && control.$input.keypress(function (e) {
						if (e.which === 13) { // Enter key pressed
							save_button.click();
						}
					});
				});




			}

			if (p.mode_of_payment === "Charge") {
				const selected_customer = cur_frm.doc.customer;



				
				let existing_custom_customer = frappe.model.get_value(p.doctype, p.name, "custom_customer");
				let custom_customer = frappe.ui.form.make_control({
					df: {
						label: 'Customer',
						fieldtype: "Data",
						placeholder: 'Customer Name',
						reqd: true
					},
					parent: this.$payment_modes.find(`.${mode}.customer`), // Use [0] to select the DOM element
					render_input: true,
				});

				
				frappe.db.get_value('Customer', selected_customer, 'customer_name')
					.then(r => {
						const result = r.message.customer_name; // Extract the customer_name from the result
						custom_customer.set_value(existing_custom_customer || result || ''); 
					})
					.catch(error => {
						console.error('Error fetching customer name:', error);
					});

				custom_customer.refresh();


				let existing_charge_invoice_number = frappe.model.get_value(p.doctype, p.name, "custom_charge_invoice_number");
				let charge_invoice_number = frappe.ui.form.make_control({
					df: {
						label: 'Charge Invoice Number',
						fieldtype: "Data", // Corrected fieldtype
						placeholder: 'Charge Invoice Number',
					},
					parent: this.$payment_modes.find(`.${mode}.charge-invoice-number`),
					render_input: true,
				});
				charge_invoice_number.set_value(existing_charge_invoice_number || '');
				charge_invoice_number.refresh();


				let existing_custom_po_number = frappe.model.get_value(p.doctype, p.name, "custom_po_number");
				let custom_po_number = frappe.ui.form.make_control({
					df: {
						label: 'PO Number',
						fieldtype: "Data", // Corrected fieldtype
						placeholder: 'PO Number',
						reqd: true
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
						reqd: true

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
						reqd: true

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


					},
					parent: this.$payment_modes.find(`.${mode}.approved-by`),
					render_input: true,
				});
				custom_approved_by.set_value(existing_custom_approved_by || '');
				custom_approved_by.refresh();



				let save_button = $(`<button class="btn btn-primary"style="text-align: right;"">Save</button>`);
				this.$payment_modes.find(`.${mode}.save-button`).append(save_button);

				let discard_button = $('<button class="btn btn-secondary" style="text-align: right; margin-left: 10px;">Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);

				const me = this;
				// Attach an event listener to the save button
				save_button.on('click', function () {
					let amount = me[`${mode}_control`].get_value(); // Get amount value
					let customer = custom_customer.get_value();
					let charge_invoice_no = charge_invoice_number.get_value();
					let po_number = custom_po_number.get_value();
					let representative = custom_representative.get_value();
					let id_number = custom_id_number.get_value();
					let approved_by = custom_approved_by.get_value();

					// let reference_no = reference_no_control.get_value();

					if (!amount || !customer || !po_number || !representative || !id_number) {
						const dialog = frappe.msgprint({
							title: __('Validation Warning'),
							message: __('All fields are required.'),
							indicator: 'orange',
							primary_action: {
								label: __('OK'),
								action: function () {
									// Close the dialog
									frappe.msg_dialog.hide();
								}
							}
						});

						$(document).on('keydown', function (e) {
							if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
								dialog.get_primary_btn().trigger('click');
							}
						});

						// Remove event listener when dialog is closed
						dialog.$wrapper.on('hidden.bs.modal', function () {
							$(document).off('keydown');
						});
						return;
					}


					frappe.model.set_value(p.doctype, p.name, "amount", flt(amount));
					frappe.model.set_value(p.doctype, p.name, "custom_customer", customer);
					frappe.model.set_value(p.doctype, p.name, "custom_charge_invoice_number", charge_invoice_no)
					frappe.model.set_value(p.doctype, p.name, "custom_po_number", po_number);
					frappe.model.set_value(p.doctype, p.name, "custom_representative", representative);
					frappe.model.set_value(p.doctype, p.name, "custom_id_number", id_number);
					frappe.model.set_value(p.doctype, p.name, "custom_approved_by", approved_by);
					// frappe.model.set_value(p.doctype, p.name, "reference_no", reference_no);

					const dialog = frappe.msgprint({
						title: __('Success'),
						message: __('Payment details have been saved.'),
						indicator: 'green',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});


					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});

				});


				discard_button.on('click', function () {
					me[`${mode}_control`].set_value(0);
					custom_customer.set_value('');
					charge_invoice_number.set_value('');
					custom_po_number.set_value('');
					custom_representative.set_value('');
					custom_id_number.set_value('');
					custom_approved_by.set_value('');
					// let reference_no = reference_no_control.get_value();


					frappe.model.set_value(p.doctype, p.name, "amount", 0);
					frappe.model.set_value(p.doctype, p.name, "custom_customer", '');
					frappe.model.set_value(p.doctype, p.name, "custom_charge_invoice_number", '');
					frappe.model.set_value(p.doctype, p.name, "custom_po_number", '');
					frappe.model.set_value(p.doctype, p.name, "custom_representative", '');
					frappe.model.set_value(p.doctype, p.name, "custom_id_number", '');
					frappe.model.set_value(p.doctype, p.name, "custom_approved_by", '');
					// frappe.model.set_value(p.doctype, p.name, "reference_no", reference_no);

					const dialog = frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function () {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});

					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});

					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});

				});

				const controls = [
					me[`${mode}_control`],
					custom_customer,
					custom_po_number,
					charge_invoice_number,
					custom_representative,
					custom_id_number,
					custom_approved_by,
				];

				controls.forEach(control => {
					control.$input && control.$input.keypress(function (e) {
						if (e.which === 13) { // Enter key pressed
							save_button.click();
						}
					});
				});
			}


			if (p.mode_of_payment === "Gift Certificate") {

				// Create input field
				let code_input = frappe.ui.form.make_control({
					df: {
						fieldtype: 'Data',
						label: 'Gift Code',
						placeholder: 'Enter Gift Code'
					},
					parent: this.$payment_modes.find(`.${mode}.gift-code`)[0],
					render_input: true
				});
			
				code_input.refresh();
			
				// Create button
				let button = frappe.ui.form.make_control({
					df: {
						label: 'Add Gift Code',
						fieldtype: 'Button',
						btn_size: 'sm', // xs, sm, lg
						click: function () {
							let code_value = code_input.get_value();
							if (code_value) {
								frappe.db.get_doc("Amesco Gift Certificate", code_value)
									.then(gift_cert => {
										// Add the gift amount to the existing payment amount
										if (gift_cert.is_used !== 1) {
											let current_amount = flt(frappe.model.get_value(p.doctype, p.name, "amount"));
											frappe.model.set_value(p.doctype, p.name, "amount", current_amount + flt(gift_cert.amount));
			
											// Push the gift code and its amount to the codes array
											frm.add_child("custom_gift_cert_used", {
												code: code_value,
											});
			
											const dialog = frappe.msgprint({
												title: __('Success'),
												message: __('Gift Certificate code added successfully.'),
												indicator: 'green',
												primary_action: {
													label: __('OK'),
													action: function () {
														frappe.msg_dialog.hide();
													}
												}
											});
			
											$(document).on('keydown', function (e) {
												if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
													dialog.get_primary_btn().trigger('click');
												}
											});
			
											// Remove event listener when dialog is closed
											dialog.$wrapper.on('hidden.bs.modal', function () {
												$(document).off('keydown');
											});
			
											// Clear input field for the next gift code
											code_input.set_value('');
			
										} else {
											frappe.msgprint({
												title: __('Error'),
												indicator: 'red',
												message: __('Gift Code Already Used. Please check the code and try again.')
											});
										}
									})
									.catch(error => {
										frappe.msgprint({
											title: __('Error'),
											indicator: 'red',
											message: __('Invalid Gift Code. Please check the code and try again.')
										});
									});
							} else {
								frappe.msgprint({
									title: __('Error'),
									indicator: 'red',
									message: __('Please enter a gift code before clicking Add Gift Code.')
								});
							}
						}
					},
					parent: this.$payment_modes.find(`.${mode}.button-code`)[0], // Ensure correct parent DOM element
					render_input: true
				});
			
				button.refresh();
			
				// Create discard button
				let discard_button = $('<button class="btn btn-secondary">Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);
			
				const me = this;
			
				// Attach an event listener to the discard button
				discard_button.on('click', function () {
					me[`${mode}_control`].set_value('');
					frappe.model.set_value(p.doctype, p.name, "amount", 0);
			
					const dialog = frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function () {
								frappe.msg_dialog.hide();
							}
						}
					});
			
					$(document).on('keydown', function (e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});
			
					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});
				});
			
				// Attach keypress event to the code input field
				code_input.$input && code_input.$input.keypress(function (e) {
					if (e.which === 13) { // Enter key pressed
						button.$input.trigger('click'); // Trigger the button click
					}
				});
			}
			
			if (p.mode_of_payment === "Amesco Plus") {
				let button = frappe.ui.form.make_control({
					df: {
						label: 'Scan',
						fieldtype: 'Button',
						btn_size: 'sm', // xs, sm, lg
						click: function () {
							// console.log('Click');
							new frappe.ui.Scanner({
								dialog: true, // open camera scanner in a dialog
								multiple: false, // stop after scanning one value
								on_scan(data) {
									// Assuming the scanned data is comma-separated
									let scannedData = data.decodedText.split(',');
									console.log("scannedData", scannedData);
									// Extracting fields from the scanned data
									let voucher_code = scannedData[0]; //'AVQR8105441319'
									let user_id = scannedData[1];
									// let date = scannedData[3];
									let email = scannedData[4];
									let amesco_points = scannedData[2];

									frappe.call({
										method: "custom_app.customapp.doctype.used_ameco_plus_code.used_ameco_plus_code.check_used_amesco_plus_code",
										args: {
											code: voucher_code
										},
										callback: function(response) {
											if (response.message) {
												frappe.msgprint(__('Amesco Plus voucher is already used.'));
											} else {
												let details_dialog = new frappe.ui.Dialog({
												title: __('Scanned Amesco Plus User'),
												fields: [
													{
														label: 'Voucher Code',
														fieldname: 'voucher_code',
														fieldtype: 'Data',
														read_only: 1,
														default: voucher_code
													},
													{
														label: 'User ID',
														fieldname: 'user_id',
														fieldtype: 'Data',
														read_only: 1,
														default: user_id
													},
													{
														label: 'Email',
														fieldname: 'email',
														fieldtype: 'Data',
														read_only: 1,
														default: email
													},
													{
														label: 'Redeem Points',
														fieldname: 'points',
														fieldtype: 'Data',
														read_only: 1,
														default: amesco_points
													}
												],
												primary_action_label: __('Ok'),
												primary_action: function () {
													frappe.model.set_value(p.doctype, p.name, "custom_am_voucher_code", voucher_code);
													frappe.model.set_value(p.doctype, p.name, "custom_am_plus_user_id", user_id);
													frappe.model.set_value(p.doctype, p.name, "custom_am_plus_user_email", email);
													frappe.model.set_value(p.doctype, p.name, "amount", flt(amesco_points));
													frm.add_child("custom_ameco_plus_code_used", {
														code: voucher_code,
													});
													details_dialog.hide();
												}
											});
											details_dialog.show();
											}
										}
									});

									
								}
							})
						}

					},
					parent: this.$payment_modes.find(`.${mode}.button-amesco-plus`)[0],
					render_input: true
				});
				button.refresh();

				let discard_button = $('<button class="btn btn-secondary" >Discard</button>');
				this.$payment_modes.find(`.${mode}.discard-button`).append(discard_button);
				const me = this;
				// Attach an event listener to the save button

				discard_button.on('click', function() {
					me[`${mode}_control`].set_value('');
					// let reference_no = reference_no_control.get_value()
					frappe.model.set_value(p.doctype, p.name, "amount", 0);
					// frappe.model.set_value(p.doctype, p.name, "reference_no", reference_no);
			
					const dialog = frappe.msgprint({
						message: __('Payment details have been discarded.'),
						indicator: 'blue',
						primary_action: {
							label: __('OK'),
							action: function() {
								// Close the dialog
								frappe.msg_dialog.hide();
							}
						}
					});


					$(document).on('keydown', function(e) {
						if (e.which === 13 && dialog.$wrapper.is(':visible')) { // 13 is the Enter key code
							dialog.get_primary_btn().trigger('click');
						}
					});
	
					// Remove event listener when dialog is closed
					dialog.$wrapper.on('hidden.bs.modal', function () {
						$(document).off('keydown');
					});
				});
				const controls = [
					me[`${mode}_control`],
				];
				controls.forEach(control => {
					control.$input && control.$input.keypress(function (e) {
						if (e.which === 13) { // Enter key pressed
							save_button.click();
						}
					});
				});



			}
			// this[`${mode}_control`].toggle_label(true);
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