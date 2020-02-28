**Create new Project**
----
  Creates and returns json Object of Created GPS tracking info.

* **URL**

  **`/ api / createGpsTracking`**

* **Method:**

  `POST`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  data Array

  eg.,
  ```json
   {
       data : [
            {
                "rooferId": "58e57629b3fd954d62c84853",
                "rooferName": "Sam Seaborn",
                "companyId": "58e57232b3fd951282c84853",
                "entryTime": "2017-10-06T10:02:06+02:00",
                "exitTime": "2017-10-06T18:16:28+02:00",
                "projectId": "58e582a2b3fd954d62c84853",
                "projectName": "Test Project Five",
                "address": {
                    "line1": "St. Canute's Cathedral",
                    "line2": "Klosterbakken 2",
                    "line3": null,
                    "city": "Odense C",
                    "postalCode": "5000",
                    "countryCode": "DK",
                    "loc": {
                        "coordinates": [
                            55.395936,
                            10.389179
                        ]
                    }
                }
            },
            {
                "rooferId": "58e57629b3fd954d62c84853",
                "rooferName": "Sam Seaborn",
                "companyId": "58e57232b3fd951282c84853",
                "entryTime": "2017-10-05T10:02:06+02:00",
                "exitTime": "2017-10-05T18:16:28+02:00",
                "projectId": "58e582a2b3fd954d62c84853",
                "projectName": "Test Project Four",
                "address": {
                    "line1": "Barton Dock Rd",
                    "line2": "Stretford",
                    "line3": null,
                    "city": "Manchester",
                    "postalCode": "M32 0YL",
                    "countryCode": "UK",
                    "loc": {
                        "coordinates": [
                            53.467137,
                            -2.344693
                        ]
                    }
                }
            }]
   }
   ```

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{   "message" : "Tracking data added successfully",
	"data"  : "<insertedJsonArray>"
}
```
 
* **Error Response:**

  * **ErrorTag:** 100 (DB ERROR) <br />
    **Content:** 
```json
    {
        "err" : 100, 
        "message" : "error fetching list"
    }
```