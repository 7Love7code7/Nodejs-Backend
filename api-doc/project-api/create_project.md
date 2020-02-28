**Create new Project**
----
  Returns json of Created project.

* **URL**

  **`/ api / createProject`**

* **Method:**

  `POST`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  project object

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