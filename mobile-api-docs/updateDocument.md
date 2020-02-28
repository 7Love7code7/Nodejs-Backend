**Add project assets**
----
  Returns json of Updated Project Details by adding Document file details into it.

* **URL**

  **`/ api / createProjectMobAddImages / :projectId`**

* **Method:**

  `POST`

*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  Document files object

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

* **URL**

  **`/ api / createProjectMobAddRoofplans / :projectId`**

* **Method:**

  `POST`

*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  Document files object

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

* **URL**

  **`/ api / createProjectMobAddOtherFiles / :projectId`**

* **Method:**

  `POST`

*  **URL Params**
    
    `None`

   **Required:**
 
   `None`

* **Data Params**

  Document files object

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