"""Build a transparent search catalog; country affinity is not ownership proof."""
import json
from pathlib import Path
import pycountry

ROOT=Path(__file__).resolve().parent
# id | name | category | regional affinity | homepage | native query URL (blank => labelled site-search route)
DATA='''google|Google|web|US|https://www.google.com/|https://www.google.com/search?q={q}
bing|Bing|web|US|https://www.bing.com/|https://www.bing.com/search?q={q}
brave|Brave Search|web|US|https://search.brave.com/|https://search.brave.com/search?q={q}
duckduckgo|DuckDuckGo|web|US|https://duckduckgo.com/|https://duckduckgo.com/?q={q}
mojeek|Mojeek|web|GB|https://www.mojeek.com/|https://www.mojeek.com/search?q={q}
qwant|Qwant|web|FR|https://www.qwant.com/|https://www.qwant.com/?q={q}&t=web
ecosia|Ecosia|web|DE|https://www.ecosia.org/|https://www.ecosia.org/search?q={q}
startpage|Startpage|web|NL|https://www.startpage.com/|https://www.startpage.com/sp/search?query={q}
swisscows|Swisscows|web|CH|https://swisscows.com/|https://swisscows.com/en/web?query={q}
marginalia|Marginalia|web|SE|https://marginalia-search.com/|https://marginalia-search.com/search?query={q}
wiby|Wiby|web|GLOBAL|https://wiby.me/|https://wiby.me/?q={q}
yahoo|Yahoo Search|web|US|https://search.yahoo.com/|https://search.yahoo.com/search?p={q}
seznam|Seznam|web|CZ|https://search.seznam.cz/|https://search.seznam.cz/?q={q}
naver|Naver|web|KR|https://search.naver.com/|https://search.naver.com/search.naver?query={q}
daum|Daum|web|KR|https://search.daum.net/|https://search.daum.net/search?q={q}
yahoo-jp|Yahoo Japan|web|JP|https://search.yahoo.co.jp/|https://search.yahoo.co.jp/search?p={q}
baidu|Baidu|web|CN|https://www.baidu.com/|https://www.baidu.com/s?wd={q}
sogou|Sogou|web|CN|https://www.sogou.com/|https://www.sogou.com/web?query={q}
360search|360 Search|web|CN|https://www.so.com/|https://www.so.com/s?q={q}
yep|Yep|web|SG|https://yep.com/|https://yep.com/web?q={q}
arxiv|arXiv|research|US|https://arxiv.org/|https://arxiv.org/search/?query={q}&searchtype=all
crossref|Crossref|research|GLOBAL|https://search.crossref.org/|https://search.crossref.org/?q={q}
openalex|OpenAlex|research|GLOBAL|https://openalex.org/|https://openalex.org/works?search={q}
semantic-scholar|Semantic Scholar|research|US|https://www.semanticscholar.org/|https://www.semanticscholar.org/search?q={q}
scholar|Google Scholar|research|US|https://scholar.google.com/|https://scholar.google.com/scholar?q={q}
base|BASE|research|DE|https://www.base-search.net/|https://www.base-search.net/Search/Results?lookfor={q}&type=all
core|CORE|research|GB|https://core.ac.uk/|https://core.ac.uk/search?q={q}
doaj|DOAJ|research|GLOBAL|https://doaj.org/|https://doaj.org/search/articles?ref=homepage-box&q={q}
pubmed|PubMed|research|US|https://pubmed.ncbi.nlm.nih.gov/|https://pubmed.ncbi.nlm.nih.gov/?term={q}
europepmc|Europe PMC|research|GB|https://europepmc.org/|https://europepmc.org/search?query={q}
zbmath|zbMATH Open|research|DE|https://zbmath.org/|https://zbmath.org/?q={q}
eudml|EuDML|research|EU|https://eudml.org/|
hal|HAL|research|FR|https://hal.science/|https://hal.science/search/index/?q={q}
zenodo|Zenodo|research|CH|https://zenodo.org/|https://zenodo.org/search?q={q}
scielo|SciELO|research|BR|https://search.scielo.org/|https://search.scielo.org/?q={q}&lang=en
redalyc|Redalyc|research|MX|https://www.redalyc.org/|
la-referencia|LA Referencia|research|LATAM|https://www.lareferencia.info/|
ajol|African Journals Online|research|ZA|https://www.ajol.info/|
jstage|J-STAGE|research|JP|https://www.jstage.jst.go.jp/|
cinii|CiNii Research|research|JP|https://cir.nii.ac.jp/|https://cir.nii.ac.jp/all?q={q}
dergipark|DergiPark|research|TR|https://dergipark.org.tr/|https://dergipark.org.tr/en/search?q={q}&section=articles
garuda|GARUDA|research|ID|https://garuda.kemdikbud.go.id/|
thaijo|Thai journal search|research|TH|https://search.tci-thailand.org/|
shodhganga|Shodhganga|research|IN|https://shodhganga.inflibnet.ac.in/|
ndl-india|National Digital Library of India|archives|IN|https://ndl.iitkgp.ac.in/|
recolecta|RECOLECTA|research|ES|https://recolecta.fecyt.es/|
github|GitHub|code|US|https://github.com/|https://github.com/search?q={q}&type=repositories
gitlab|GitLab|code|GLOBAL|https://gitlab.com/|https://gitlab.com/search?search={q}
stackoverflow|Stack Overflow|code|US|https://stackoverflow.com/|https://stackoverflow.com/search?q={q}
huggingface|Hugging Face|code|GLOBAL|https://huggingface.co/|https://huggingface.co/models?search={q}
datagov|Data.gov|code|US|https://data.gov/|https://catalog.data.gov/dataset?q={q}
eu-data|European Data Portal|code|EU|https://data.europa.eu/|https://data.europa.eu/data/datasets?query={q}&locale=en
worldbank|World Bank Data|code|GLOBAL|https://data.worldbank.org/|
gbif|GBIF|code|DK|https://www.gbif.org/|https://www.gbif.org/dataset/search?q={q}
internetarchive|Internet Archive|archives|US|https://archive.org/|https://archive.org/search?query={q}
openlibrary|Open Library|archives|US|https://openlibrary.org/|https://openlibrary.org/search?q={q}
worldcat|WorldCat|archives|GLOBAL|https://search.worldcat.org/|https://search.worldcat.org/search?q={q}
loc|Library of Congress|archives|US|https://www.loc.gov/|https://www.loc.gov/search/?q={q}
europeana|Europeana|archives|EU|https://www.europeana.eu/|https://www.europeana.eu/en/search?query={q}
trove|Trove|archives|AU|https://trove.nla.gov.au/|https://trove.nla.gov.au/search?keyword={q}
paperspast|Papers Past|archives|NZ|https://paperspast.natlib.govt.nz/|
canada-archives|Library and Archives Canada|archives|CA|https://library-archives.canada.ca/|
wikipedia|Wikipedia|archives|GLOBAL|https://www.wikipedia.org/|https://en.wikipedia.org/w/index.php?search={q}
wikimedia|Wikimedia Commons|archives|GLOBAL|https://commons.wikimedia.org/|https://commons.wikimedia.org/w/index.php?search={q}
openverse|Openverse|archives|GLOBAL|https://openverse.org/|https://openverse.org/search/?q={q}'''

def build():
    providers=[]
    for line in DATA.splitlines():
        ident,name,category,affinity,home,url=line.split('|')
        providers.append(dict(id=ident,name=name,category=category,country_affinity=affinity,
            homepage=home,query_template=url or None,enabled=True,
            mode='api_and_launch' if ident in {'crossref','europepmc'} else 'launch',
            route_kind='native_search' if url else 'site_search_via_brave',
            index_family={'brave':'brave','mojeek':'mojeek','duckduckgo':'bing_and_other_sources',
                'crossref':'crossref_metadata','europepmc':'europepmc_metadata'}.get(ident,'unverified'),
            evidence_url=home,verification='catalogued; live result retrieval not asserted',
            known_russian_provider=False))
    countries=[{'code':c.alpha_2,'name':c.name,'local_provider_ids':[p['id'] for p in providers if p['country_affinity']==c.alpha_2],
       'fallback':'global_engines_with_country_keyword','local_origin_guaranteed':False}
       for c in sorted(pycountry.countries,key=lambda c:c.name) if c.alpha_2!='RU']
    result={'version':'3.0','country_source':'pycountry '+pycountry.__version__,
       'policy':{'excluded_country':'RU','excluded_provider_names':['Yandex','Rambler','Mail.ru','Sputnik','Nigma','Aport'],
        'blocked_roots':['yandex.com','yandex.ru','ya.ru','rambler.ru','mail.ru','go.mail.ru','sputnik.ru','nigma.ru','aport.ru'],
        'blocked_tlds':['ru','su','xn--p1ai'],
        'scope':'Provider routing and known endpoints; not a claim of zero Russian-origin documents, investment or hidden upstream dependencies'},
       'providers':providers,'countries':countries}
    (ROOT/'catalog.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(len(providers),'providers;',len(countries),'country/territory routes')
if __name__=='__main__':build()
