**Create new RooferConcern**
----
  Returns json of Created Project.

* **URL**

  **`/ api / createProjectMob`**

* **Method:**

  `POST`
  
*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  Project object

  isServiceProject (0 - No , 1 - Yes)

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