import json
from unittest.mock import patch
import pytest
from search import CATALOG,COUNTRIES,PROVIDERS,allowed_url,plan,search,GlobalSearchCarrier

def test_all_routes_enabled_and_all_country_profiles_resolve():
    assert len(COUNTRIES)==248 and 'RU' not in COUNTRIES
    assert all(p['enabled'] for p in PROVIDERS.values())
    for country in COUNTRIES:
        result=plan('日本語 🌊 & x=1',country)
        assert len(result['routes'])==65
        assert all(allowed_url(x['url']) for x in result['routes'])
        assert result['authority_transfer'] is False

@pytest.mark.parametrize('url',['https://yandex.com/search','https://yandex.kz/search','https://YA.RU./','https://search.rambler.ru','https://example.ru','https://example.su','https://пример.рф','https://google.com@yandex.com','javascript:alert(1)'])
def test_excluded_routes_and_disguises(url):assert not allowed_url(url)

def test_legitimate_host_is_not_rejected_by_substring():
    assert allowed_url('https://www.google.com/search?q=russia')
    assert allowed_url('https://example.org/not-yandex.com')

def test_country_exclusion_is_enforced_not_just_hidden():
    with pytest.raises(ValueError):plan('research','RU')

def test_unavailable_is_not_an_empty_success():
    with patch('search._fetch',side_effect=TimeoutError):
        out=GlobalSearchCarrier().execute({'search':{'query':'public probe','category':'research'}})
    assert out['ok'] is False and len(out['artifact']['routes'])>0
    assert any('unavailable' in r for r in out['unresolved'])

def test_duplicate_metadata_keeps_both_provenance_records_without_corroboration():
    def fake(provider,q,n):return {'provider':provider,'status':'ok','results':[{'title':'A','url':'https://doi.org/10.1234/test','doi':'10.1234/test','provider':provider,'retrieved_at':'fixture'}]}
    with patch('search._fetch',side_effect=fake):out=search('probe')
    assert len(out['results'])==1 and len(out['results'][0]['provenance'])==2
    assert out['corroborated'] is False

def test_empty_or_excessive_query_does_not_dispatch():
    for q in ['', ' '*3,'a'*2049]:
        with pytest.raises(ValueError):plan(q)
