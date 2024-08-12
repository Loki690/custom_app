import frappe

def force_password_reset(login_manager):
    user = frappe.get_doc('User', frappe.session.user)

    # Check if the user is logging in for the first time
    if user.reset_password != 1:
        user.reset_password = 1
        user.save(ignore_permissions=True)

        frappe.msgprint(
            "You must change your password after your first login.",
            alert=True
        )
