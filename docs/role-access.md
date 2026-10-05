# Workspace access by role

The UI selects features from the signed-in profile. The API is the authority for every record and mutation; a hidden button is not an access-control boundary.

| Role | Workspace view and actions |
| --- | --- |
| All signed-in roles | Update their profile name and phone number; the verified account email stays read-only |
| Customer | View parcels addressed to the verified account email, follow tracking events, cancel before pickup, and pay eligible COD parcels online |
| Merchant | View merchant-scoped parcels, manage recipients, book parcels, and choose an allowed origin hub |
| Hub manager | View the assigned hub's parcels and inbound transfers, dispatch to another active hub, receive transfers, and assign available riders from the parcel's current hub |
| Rider | View active assignments for the rider account and submit delivered/failed delivery updates |
| Admin | View and process network parcels, receive inbound transfers, and create/manage branches, hubs, vehicles, riders, and hub managers; reassign managers to hubs |
| Super admin | View network parcels and create administrator accounts |

Customer portal routes require a verified email. Managers without a hub mapping cannot load hub operations. Destination hub choices are a directory only and do not grant access to destination hub parcels.
