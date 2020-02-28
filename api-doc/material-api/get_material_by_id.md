**List Materials By Id**
----
  Returns json Object a requested Materials.

* **URL**

  **`/ api / getMaterialById / :MaterialId`**

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
	Material Object
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