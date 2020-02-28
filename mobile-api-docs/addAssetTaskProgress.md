**Add image for task progress**
----
  Returns json of Created assset

* **URL**

  **`/ api / addAssetTaskProgressById / :taskProgressID`**

* **Method:**

  `POST`

*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  multipart-image

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	new TaskProgress Object
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