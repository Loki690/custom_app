# your_app/utils.py

from datetime import datetime

def custom_format_datetime(datetime_str):
    dt = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S.%f')
    return dt.strftime('%A, %m-%d-%Y %I:%M:%S %p')
