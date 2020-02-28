**Create new Project**
----
  Read GPS tracking info

* **URL**

  **`/ api / readGpsTracking`**

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
       "trackingId" : "<_id>" // OPTIONAL (will return an array of all entries belonging to the company if left empty)
   }
   ```

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{   "message" : "Tracking data loaded successfully",
	"data"  : "<data>"
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