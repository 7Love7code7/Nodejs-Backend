**Create new TaskProgress**
----
  Returns json of Created taskProgress.

* **URL**

  **`/ api / createTaskProgressForProject / :projectId`**

* **Method:**

  `POST`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  taskProgress object

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	TaskProgress Object
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