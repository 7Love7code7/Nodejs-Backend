**List rooferTimeLog By Id**
----
  Returns json Object a requested rooferTimeLog.

* **URL**

  **`/ api / getRooferTimeLogById / :rooferTimeLogId`**

* **Method:**

  `GET`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	rooferTimeLog Object
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