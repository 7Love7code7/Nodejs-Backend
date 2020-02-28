**Delete task By Id**
----
  Returns json Object a deleted task.

* **URL**

  **`/ api / deleteTaskById / :taskId`**

* **Method:**

  `DELETE`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

    `None`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	deleted task Object
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