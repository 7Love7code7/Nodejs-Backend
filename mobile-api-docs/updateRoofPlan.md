**Create new TaskProgress**
----
  Returns json of Updated Project Details by adding Roof Plan details into it.

* **URL**

  **`/ api / addAssetProjectMobRoofFileById / :projectId`**

* **Method:**

  `POST`

*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  Roof Plan files object

* **Success Response:**

  * **Code:** 200 <br />
    **Content:**
```json
{
	Updated Project Object
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