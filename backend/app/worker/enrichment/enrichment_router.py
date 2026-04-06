import re

def detect_ioc_type(value: str) -> str:
    """Auto-detects IOC type from input string."""
    value = value.strip()
    
    # IPv4 regex
    if re.match(r'^(\d{1,3}\.){3}\d{1,3}$', value):
        return "IP"
    
    # MD5
    if re.match(r'^[a-fA-F0-9]{32}$', value):
        return "HASH_MD5"
        
    # SHA256
    if re.match(r'^[a-fA-F0-9]{64}$', value):
        return "HASH_SHA256"
        
    # CVE ID
    if re.match(r'^CVE-\d{4}-\d{4,}$', value, re.IGNORECASE):
        return "CVE"
        
    # URL prefix
    if value.lower().startswith("http://") or value.lower().startswith("https://"):
        return "URL"
        
    # Domain / FQDN check
    if re.match(r'^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$', value):
        return "DOMAIN"
        
    return "UNKNOWN"
