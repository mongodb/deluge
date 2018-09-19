from .utils import anonymize_ip


def test_ipv4() -> None:
    assert anonymize_ip('241.129.42.29') == '241.129.42.0'


def test_ipv6() -> None:
    assert anonymize_ip('FE80:0000:fFFF:0000:0202:B3FF:FE1E:8329') == \
        'fe80:0000:ffff:0000:0000:0000:0000:0000'
