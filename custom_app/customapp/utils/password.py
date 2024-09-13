# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: MIT. See LICENSE

from cryptography.fernet import Fernet, InvalidToken
from frappe.exceptions import AuthenticationError
from passlib.context import CryptContext
from pypika.terms import Values

import frappe
from frappe import _
from frappe.query_builder import Table
from frappe.utils import cstr, encode

Auth = Table("__Auth")


passlibctx = CryptContext(
	schemes=[
		"pbkdf2_sha256",
		"argon2",
	],
)


def get_decrypted_password(doctype, name, fieldname="password", raise_exception=True):
	result = (
		frappe.qb.from_(Auth)
		.select(Auth.password)
		.where(
			(Auth.doctype == doctype)
			& (Auth.name == name)
			& (Auth.fieldname == fieldname)
			& (Auth.encrypted == 1)
		)
		.limit(1)
	).run()

	if result and result[0][0]:
		return decrypt(result[0][0])

	elif raise_exception:
		frappe.throw(
			_("Password not found for {0} {1} {2}").format(doctype, name, fieldname),
			frappe.AuthenticationError,
		)


def set_encrypted_password(doctype, name, pwd, fieldname="password"):
	query = (
		frappe.qb.into(Auth)
		.columns(Auth.doctype, Auth.name, Auth.fieldname, Auth.password, Auth.encrypted)
		.insert(doctype, name, fieldname, encrypt(pwd), 1)
	)

	# TODO: Simplify this via aliasing methods in `frappe.qb`
	if frappe.db.db_type == "mariadb":
		query = query.on_duplicate_key_update(Auth.password, Values(Auth.password))
	elif frappe.db.db_type == "postgres":
		query = query.on_conflict(Auth.doctype, Auth.name, Auth.fieldname).do_update(Auth.password)

	try:
		query.run()

	except frappe.db.DataError as e:
		if frappe.db.is_data_too_long(e):
			frappe.throw(_("Most probably your password is too long."), exc=e)
		raise e


def remove_encrypted_password(doctype, name, fieldname="password"):
	frappe.db.delete("__Auth", {"doctype": doctype, "name": name, "fieldname": fieldname})


def check_password(user, pwd, doctype="User", fieldname="password", delete_tracker_cache=True):
	"""Checks if user and password are correct, else raises frappe.AuthenticationError"""

	result = (
		frappe.qb.from_(Auth)
		.select(Auth.name, Auth.password)
		.where(
			(Auth.doctype == doctype)
			& (Auth.name == user)
			& (Auth.fieldname == fieldname)
			& (Auth.encrypted == 0)
		)
		.limit(1)
		.run(as_dict=True)
	)

	if not result or not passlibctx.verify(pwd, result[0].password):
		raise frappe.AuthenticationError(_("Incorrect User or Password"))

	# lettercase agnostic
	user = result[0].name

	# TODO: This need to be deleted after checking side effects of it.
	# We have a `LoginAttemptTracker` that can take care of tracking related cache.
	if delete_tracker_cache:
		delete_login_failed_cache(user)

	if passlibctx.needs_update(result[0].password):
		update_password(user, pwd, doctype, fieldname)

	return user


def check_password_without_username(pwd, doctype="User", fieldname="password"):
    """
    Checks if the given password matches any user's password.
    If it matches, return the user's details if they have the allowed roles.
    """
    try:
        # Fetch all user documents
        all_users = frappe.get_all("User", fields=["name", "email", "full_name", "enabled"])

        for user in all_users:
            # Check if the entered password matches the stored hashed password
            try:
                if check_password(user["name"], pwd):
                    user_doc = frappe.get_doc("User", user["name"])
                    user_roles = [d.role for d in user_doc.get("roles")]
                    
                    allowed_roles = ['Cashier', 'Pharmacist Assistant', 'Officer-in-Charge', 'System Manager', 'IT Manager ']
                    
                    # Check if user has any of the allowed roles
                    if any(role in allowed_roles for role in user_roles):
                        return {
                            "name": user_doc.name,
                            "email": user_doc.email,
                            "full_name": user_doc.full_name,
                            "roles": user_roles,
                            "enabled": user_doc.enabled,
                        }
            except AuthenticationError:
                continue

        return {"error": "Invalid password or no matching roles"}
    except Exception as e:
        return {"error": str(e)}  


def check_password_cashier(pwd, doctype="User", fieldname="password"):
    """
    Checks if the given password matches any user's password.
    If it matches, return the user's details if they have the allowed roles.
    """
    try:
        # Fetch all user documents
        all_users = frappe.get_all("User", fields=["name", "email", "full_name", "enabled"])

        for user in all_users:
            # Check if the entered password matches the stored hashed password
            try:
                if check_password(user["name"], pwd):
                    user_doc = frappe.get_doc("User", user["name"])
                    user_roles = [d.role for d in user_doc.get("roles")]
                    
                    allowed_roles = ['Cashier']
                    
                    # Check if user has any of the allowed roles
                    if any(role in allowed_roles for role in user_roles):
                        return {
                            "name": user_doc.name,
                            "email": user_doc.email,
                            "full_name": user_doc.full_name,
                            "roles": user_roles,
                            "enabled": user_doc.enabled,
                        }
            except AuthenticationError:
                continue

        return {"error": "Invalid password or no matching roles"}
    except Exception as e:
        return {"error": str(e)}

def check_password_oic(pwd, doctype="User", fieldname="password"):
    """
    Checks if the given password matches any user's password.
    If it matches, return the user's details if they have the allowed roles.
    """
    try:
        # Fetch all user documents
        all_users = frappe.get_all("User", fields=["name", "email", "full_name", "enabled"])

        for user in all_users:
            # Check if the entered password matches the stored hashed password
            try:
                if check_password(user["name"], pwd):
                    user_doc = frappe.get_doc("User", user["name"])
                    user_roles = [d.role for d in user_doc.get("roles")]
                    
                    allowed_roles = ['Officer-in-Charge']
                    
                    # Check if user has any of the allowed roles
                    if any(role in allowed_roles for role in user_roles):
                        return {
                            "name": user_doc.name,
                            "email": user_doc.email,
                            "full_name": user_doc.full_name,
                            "roles": user_roles,
                            "enabled": user_doc.enabled,
                        }
            except AuthenticationError:
                continue

        return {"error": "Invalid password or no matching roles"}
    except Exception as e:
        return {"error": str(e)}





def check_oic_password(pwd, doctype="User", fieldname="password"):
    """
    Checks if the given password matches any user's password.
    If it matches, return the user's details if they have the allowed roles.
    """
    try:
        # Fetch all user documents
        all_users = frappe.get_all("User", fields=["name", "email", "full_name", "enabled"])

        for user in all_users:
            # Check if the entered password matches the stored hashed password
            try:
                if check_password(user["name"], pwd):
                    user_doc = frappe.get_doc("User", user["name"])
                    user_roles = [d.role for d in user_doc.get("roles")]
                    
                    allowed_roles = ['Officer-in-Charge', 'System Manager', 'IT Manager ']
                    
                    # Check if user has any of the allowed roles
                    if any(role in allowed_roles for role in user_roles):
                        return {
                            "name": user_doc.name,
                            "email": user_doc.email,
                            "full_name": user_doc.full_name,
                            "roles": user_roles,
                            "enabled": user_doc.enabled,
                        }
            except AuthenticationError:
                continue

        return {"error": "Invalid password or no matching roles"}
    except Exception as e:
        return {"error": str(e)}
    
    
def check_system_manager_password(pwd, doctype="User", fieldname="password"):
    """
    Checks if the given password matches any user's password.
    If it matches, return the user's details if they have the allowed roles.
    """
    try:
        # Fetch all user documents
        all_users = frappe.get_all("User", fields=["name", "email", "full_name", "enabled"])

        for user in all_users:
            # Check if the entered password matches the stored hashed password
            try:
                if check_password(user["name"], pwd):
                    user_doc = frappe.get_doc("User", user["name"])
                    user_roles = [d.role for d in user_doc.get("roles")]
                    
                    allowed_roles = ['System Manager']
                    
                    # Check if user has any of the allowed roles
                    if any(role in allowed_roles for role in user_roles):
                        return {
                            "name": user_doc.name,
                            "email": user_doc.email,
                            "full_name": user_doc.full_name,
                            "roles": user_roles,
                            "enabled": user_doc.enabled,
                        }
            except AuthenticationError:
                continue

        return {"error": "Invalid password or no matching roles"}
    except Exception as e:
        return {"error": str(e)}


	
# def check_oic_password(pwd, role, doctype="User", fieldname="password", delete_tracker_cache=True):
#     """Checks if user and password are correct and the user has the specified role, else raises frappe.AuthenticationError"""

#     results = frappe.db.sql(
#         """SELECT auth.password, usr.role_profile_name 
#            FROM __Auth auth 
#            LEFT JOIN tabUser usr ON usr.name = auth.name 
#            WHERE usr.role_profile_name = %s""",
#         (role,),
#         as_dict=True
#     )

#     if not results:
#         raise frappe.AuthenticationError(_("Incorrect User or Password"))

#     authenticated = False

#     for result in results:
#         if passlibctx.verify(pwd, result.password):
#             authenticated = True
#             # Check if the user has the specified role
#             if result.role_profile_name == role:
#                 pwd = result.password

#                 # TODO: This needs to be deleted after checking side effects of it.
#                 # We have a LoginAttemptTracker that can take care of tracking related cache.
#                 if delete_tracker_cache:
#                     delete_login_failed_cache(pwd)

#                 if passlibctx.needs_update(result.password):
#                     update_password(pwd, doctype, fieldname)

#                 break

#     if not authenticated:
#         raise frappe.AuthenticationError(_("Unauthorized access"))

#     return pwd


def delete_login_failed_cache(user):
	frappe.cache.hdel("last_login_tried", user)
	frappe.cache.hdel("login_failed_count", user)
	frappe.cache.hdel("locked_account_time", user)


def update_password(user, pwd, doctype="User", fieldname="password", logout_all_sessions=False):
	"""
	Update the password for the User

	:param user: username
	:param pwd: new password
	:param doctype: doctype name (for encryption)
	:param fieldname: fieldname (in given doctype) (for encryption)
	:param logout_all_session: delete all other session
	"""
	hashPwd = passlibctx.hash(pwd)

	query = (
		frappe.qb.into(Auth)
		.columns(Auth.doctype, Auth.name, Auth.fieldname, Auth.password, Auth.encrypted)
		.insert(doctype, user, fieldname, hashPwd, 0)
	)

	# TODO: Simplify this via aliasing methods in `frappe.qb`
	if frappe.db.db_type == "mariadb":
		query = query.on_duplicate_key_update(Auth.password, hashPwd).on_duplicate_key_update(
			Auth.encrypted, 0
		)
	elif frappe.db.db_type == "postgres":
		query = (
			query.on_conflict(Auth.doctype, Auth.name, Auth.fieldname)
			.do_update(Auth.password, hashPwd)
			.do_update(Auth.encrypted, 0)
		)

	query.run()

	# clear all the sessions except current
	if logout_all_sessions:
		from frappe.sessions import clear_sessions

		clear_sessions(user=user, keep_current=True, force=True)


def delete_all_passwords_for(doctype, name):
	try:
		frappe.db.delete("__Auth", {"doctype": doctype, "name": name})
	except Exception as e:
		if not frappe.db.is_missing_column(e):
			raise


def rename_password(doctype, old_name, new_name):
	# NOTE: fieldname is not considered, since the document is renamed
	frappe.qb.update(Auth).set(Auth.name, new_name).where(
		(Auth.doctype == doctype) & (Auth.name == old_name)
	).run()


def rename_password_field(doctype, old_fieldname, new_fieldname):
	frappe.qb.update(Auth).set(Auth.fieldname, new_fieldname).where(
		(Auth.doctype == doctype) & (Auth.fieldname == old_fieldname)
	).run()


def create_auth_table():
	# same as Framework.sql
	frappe.db.create_auth_table()


def encrypt(txt, encryption_key=None):
	# Only use Fernet.generate_key().decode() to enter encyption_key value

	try:
		cipher_suite = Fernet(encode(encryption_key or get_encryption_key()))
	except Exception:
		# encryption_key is not in 32 url-safe base64-encoded format
		frappe.throw(_("Encryption key is in invalid format!"))

	return cstr(cipher_suite.encrypt(encode(txt)))


def decrypt(txt, encryption_key=None):
	# Only use encryption_key value generated with Fernet.generate_key().decode()

	try:
		cipher_suite = Fernet(encode(encryption_key or get_encryption_key()))
		return cstr(cipher_suite.decrypt(encode(txt)))
	except InvalidToken:
		# encryption_key in site_config is changed and not valid
		frappe.throw(
			_("Encryption key is invalid! Please check site_config.json")
			+ "<br>"
			+ _(
				"If you have recently restored the site you may need to copy the site config contaning original Encryption Key."
			)
			+ "<br>"
			+ _(
				"Please visit https://frappecloud.com/docs/sites/migrate-an-existing-site#encryption-key for more information."
			),
		)


def get_encryption_key():
	if "encryption_key" not in frappe.local.conf:
		from frappe.installer import update_site_config

		encryption_key = Fernet.generate_key().decode()
		update_site_config("encryption_key", encryption_key)
		frappe.local.conf.encryption_key = encryption_key

	return frappe.local.conf.encryption_key


def get_password_reset_limit():
	return frappe.get_system_settings("password_reset_limit") or 3

def confirm_user_acc_user_password(user, password):
    # Get the current user
    try:
        # Check if the entered password matches the stored hashed password
        if check_password(user, password):
            return True
        else:
            return False
    except AuthenticationError:
        return False
