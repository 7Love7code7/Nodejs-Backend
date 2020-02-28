**List Project By Id**
----
  Returns json Object a requested project.

* **URL**

  **`/ api / getProjectById / :projectId`**

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
	Project Object
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