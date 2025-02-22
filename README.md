Our customer gave us a CSV file (country-borders.zip) with description of boundaries of all the countries in the world. Each country can consist of one or more mainland parts but also islands in the sea. Our customer requires us to identify those boundaries that belong to the mainland (thus filtering out islands).

Example: Cambodia consists of 5 boundaries which are listed in the CSV on 5 separate lines:

country:CB,KP,Cambodia,103.782 10.5147:103.788 10.5133:...
country:CB.2,KP,Cambodia,103.024 11.4247:102.996 11.5061:102.996 11.5169:...
country:CB.3,KP,Cambodia,103.025 11.2456:103.022 11.2461:103.005 11.2506:...
country:CB.4,KP,Cambodia,103.27 10.6697:103.261 10.6964:103.256 10.7097:...
country:CB.5,KP,Cambodia,104.445 10.4227:104.346 10.4928:104.276 10.5433:104.253 10.5653:104.251 10.5667:...

## Description of CSV columns

| Column | Example               | Description |
|--------|-----------------------|------------|
| 1      | country:CB.3          | Unique ID of the boundary (i.e. there is no other line in the CSV file with the same ID). The example `country:CB.3` simply means the 3rd boundary polygon in a country with code CB. We do not know what is the system used for assigning these 2-letter country codes. |
| 2      | KP                    | 2-letter country code in a system that we know nothing about. |
| 3      | Cambodia              | Country name |
| 4      | 103.02 11.42:102.9 11.5:... | A list of geographical coordinates that define the boundary of a part of the country (a mainland part or an island). Individual points are delimited by `:`. Components of a point are geographical longitude and geographical latitude, separated by a space and given in degrees. |

Write a computer program (in C++, Python, TypeScript, Go, Rust or Java) that will write out a list of IDs of these polygons that belong to the mainland (leaving out the island parts).