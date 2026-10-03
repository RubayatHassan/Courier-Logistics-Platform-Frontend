# Workspace access by role

The UI selects features from the signed-in profile. The API is the authority for every record and mutation; a hidden button is not an access-control boundary.

| Role | Workspace view and actions |
| --- | --- |
| Customer | View parcels addressed to the verified account email, follow tracking events, cancel before pickup, and pay eligible COD parcels online |
| Merchant | View merchant-scoped parcels, manage recipients, book parcels, and choose an allowed origin hub |
| Hub manager | View the assigned hub's parcels and inbound transfers, dispatch to another active hub, receive transfers, and assign available riders from the parcel's current hub |
| Rider | View active assignments for the rider account and submit delivered/failed delivery updates |
| Admin | View network parcels and incoming transfers |
| Super admin | View the network parcel list; advanced administration screens are not exposed in this frontend |

Customer portal routes require a verified email. Managers without a hub mapping cannot load hub operations. Destination hub choices are a directory only and do not grant access to destination hub parcels.
