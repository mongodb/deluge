import ipaddress


def anonymize_ip(ip: str) -> str:
    """Zero the least-significant octets of an IP address to avoid
       propagating PII."""
    parsed = ipaddress.ip_address(ip)

    # Redact the bottom bits, matching what Google Analytics documents
    redact_bits = 8 if parsed.version == 4 else 80
    redacted_ip_integer = int(parsed) >> redact_bits << redact_bits
    return ipaddress.ip_address(redacted_ip_integer).exploded
