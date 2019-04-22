# Municipal Object Detection
Landon Baxter, Galen Pogoncheff, Robert Renecker, Chance Roberts

## Overview
For our senior projects class, we worked with Trimble to create a system that uses machine learning to detect the presence of municipal objects within street imagery. The results of this object detection are then displayed on a web application deployed on Heroku.

This README is meant to be a step-by-step "cookbook" that describes how to get the system up and running, and how each subsystem works.

#### Contents
- [Obtaining and Submitting Images](#images)
  * [Obtaining images from Data Ocean](#obtain)
  * [Submitting to S3 Bucket for inference](#submit)
- [S3](#s3)
  * [Bucket hierarchy](#hierarchy)
- [SageMaker](#sagemaker)
  * [SageMaker Notebook Instance](#notebookinstance)
- [Setting up database locally](#database)
  * [Installing Postgres](#installpg)
  * [Creating database and table](#createdb)
- [Local ExpressJS API Server](#server)  
  * [Installing node package manager (npm)](#npm)
  * [Installing dependencies for server](#backenddependencies)
  * [Starting server with necessary environment variables](#startserver)
- [Local React App](#react)  
  * [Installing dependencies for react app](#reactdependencies)
  * [Starting react dev server](#startreact)  
- [Heroku](#heroku)
  * [Pushing builds to Heroku](#pushheroku)
  * [Heroku scripts](#herokuscripts) 
  * [Viewing Heroku database contents](#dbheroku)
- [Issues / Pain points](#issues) 
  * [AWS](#awsissues) 
  * [Web application](#webissues) 
  * [Heroku](#herokuissues) 
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)
- [License](#license)


<a name="images"></a>
## Obtaining and Submitting Images  
This section discusses how we pulled images from the Data Ocean and uploaded them to the appropriate S3 bucket.  

<a name="obtain"></a>
### Obtaining images from Data Ocean
<b>The script to run the command line interface to interact with the data ocean</b>
- processImages/download/collect_image_data.py

This script needs some information in order to interact with the data ocean.

<b>Create a authentication.txt file in the processImages/download/ directory.</b>
  - In the following order, include per line these values
    - host-identity
    - host
    - Credential to be used when Generating TID access token.



<a name="submit"></a>
### Submitting to S3 Bucket for inference   

<b>Transforming images to correct schema:</b>
- After downloading images from the data ocean, or having them locally saved on your computer in a folder, you will need to run this script in order to transform (if needed) the images to the correct schema that our model will expect.
- in the processImages/upload/ directory, run the rotate_images.py script.
  - it will take an argument for the pathway of the folder:
  - USAGE: python rotate_images.py -pathway [PATHWAY_TO_IMAGE_FOLDER]
  - Example: python rotate_images.py -pathway ../images/

<b>Uploading images to S3:</b>
- The upload script is found in processImages/upload directory, named bucket_upload.py
- Follow these initial configuration steps to upload correctly to the bucket of your choice.
- Credentials:
  - Using boto3 library
    - ```pip install boto3```
    - Using AWS CLI (install if you don't have already)
      - ```aws configure```
      - Using the CLI, set and store your aws_access_key and your aws_secret_access_key.
- In the bucket_upload.py file, change the variable ```bucket``` to be the name of the bucket you wish to upload.
  - The images will be uploaded to that bucket's child folder named "images".
- Running the script
  - USAGE: python bucket_upload.py -pathway [PATHWAY_TO_IMAGE_FOLDER]
  - Example: python bucket_upload.py -pathway ../images/specific_city_images/



<a name="s3"></a>
## S3   
This section discusses how we designed the hierarchy of our S3 buckets and how they should be navigated.     

<a name="hierarchy"></a>
### Bucket hierarchy  
Our S3 buckets consisted of five major directories.  
- ```images```: The unlabeled images that will be passed through the inference pipeline. Scripts that migrate images of interest should insert their images into this directory.  
- ```images-preprocessed```: The unlabeled images after they have been passed through any preprocessing steps (orientation fixes, filename fixes, etc).  
- ```input```: The preprocessed images converted to JSON format. JSON is the format that our model expects.  
- ```output```: The output files of the inference. One output file per input file. Formatted in JSON. Each file contains a set of regions that may contain an object, the label of each region, and the confidence that each label is correct.   
- ```output-detections```: The images from ```images``` with bounding boxes drawn on them. These bounding boxes are defined by an image's output file in ```output```. These labeled images are then referenced by the website/webserver (which stores the URLs to each image in a database).   

<a name="sagemaker"></a>
## SageMaker 
Our object detection model training, deployment, and inference processes were all accomplished within Amazon's Sagemaker platform by writing custom scripts to work alongside [TensorFlow's Object Detection API](https://github.com/tensorflow/models/tree/master/research/object_detection).  The following section contains information regarding the individual components that made these processes possible.

<a name="notebookinstance"></a>
### SageMaker Notebook Instance
The scripts used to train, deploy, and perform inference using our object detection model are contained in the notebook instance titled **cucapstone-ml-notebook**.  This notebook instance can be opened by navigating to the Notebook Instances tab from the SageMaker dashboard, selecting the notebook **cucapstone-ml-notebook**, starting the notebook by clicking the 'start' action, and finally, once the notebook instance has started, clicking 'Open Jupyter' to open the notebook instance.

Upon opening the notebook, please navigate to the directory named 'SageMaker'.  There are three important objects within this directory that permit the training, deployment, and inference processes:
- ```container``` :  This subdirectory contains the object detection training and inference algorithms , associated TensorFlow Object Detection API methods and utilities, and the relevant scripts that SageMaker needs to host this model.  The contents of this subdirectory are have been pushed to a Docker image located in the ECR repository named **sagemaker-municipal-object-detection-inception-v2**.  SageMaker delegates training, deployment, and inference processes to this docker container.  Since the Docker image for our model code has already been created, this subdirectory will not need to be accessed unless the user desires to make changes to the model itself.
- ```train_and_deploy.ipynb``` :  This Python notebook contains the methods for starting a training job for our object detection model.  This is done by creating a SageMaker estimator object (in which we specify the location of the model's associated Docker image, the S3 output destination for the trained model data, and other training details such as the maximum training time, training instance type, etc.) and calling the fit() method on the estimator.  Once this fit() method completes, the training model data is exported as a compressed file to the specified S3 location.  Our trained model can be located at ```s3://sagemaker-gettingstarted/tf-api-testing/inception-v2-output```.  The final steps in this notebook involve temporarily deploying the trained model, and then deleting the deployed model endpoint.  These final steps were simply used in the development process to assure that the model training process concluded as we expected.  Since we have already trained out object detection model, this Python notebook need not be run unless the user would like to re-train the model.
- ```inference_pipeline.ipynb``` :  This Python notebook contains the methods for performing inference on supplied MX9 data.  As such, this will most likely be the Python notebook that will be accessed and run frequently.  Within this Python notebook a three-step process is performed - data preprocessing, data inference, and uploading of the inference result to our web back-end.  Full documentation for this process is included in markdown within the Python notebook itself.  To run this process, simply open the Python notebook, select Cell from the toolbar, and click 'Run All' in the Cell dropdown.

<a name="database"></a>
## Setting up database locally  
In order to develop and test the application locally, you must create and run a PostgreSQL database. The following sections will describe how to create the database and the necessary table.

<a name="installpg"></a>
### Installing PostgreSQL
The following link will instruct you how to [install PostgreSQL](https://www.postgresql.org/download/). Please take note of any username or password that you configure in this step.  

Test that the installation worked by using the ```psql``` command to start the SQL shell.

<a name="createdb"></a>
### Creating database and table
The following steps describe how to create the database and the table. Open the PostgreSQL shell by using the ```psql``` command.  
1. Create a database using the following command. Once done, use the ```\q``` command to quit the PostgreSQL shell.
~~~sql
CREATE DATABASE capstone;
~~~  
2. In bash, start the SQL shell again, this time passing it the desired database: ```psql capstone```
3. Create the table with the following command.  
~~~sql
CREATE TABLE images (
    id SERIAL,
    latitude numeric,
    longitude numeric,
    url character varying(150),
    has_stop_sign boolean,
    has_street_light boolean
);
~~~
4. Once the table is created, try inserting into it with the following query:
~~~sql
INSERT INTO images(latitude, longitude, url, has_stop_sign, has_street_light) VALUES(-10.123, -12.001, 'img.example.com', false, true);
~~~
5. Verify that it worked:
~~~sql
SELECT * FROM images;
~~~

Once everything works, the database is ready for interaction with the development website. Make sure to remember the username/password (if any), as these will be needed to access the database from the development server.


<a name="server"></a>
## Local ExpressJS API Server
The ExpressJS API server is used for two purposes: routing POST requests from SageMaker and GET requests from the web app client. This section details how to setup the local API server for development.  

<a name="npm"></a>
### Installing node package manager (npm)
[Tutorial for installing Node and npm](https://www.npmjs.com/get-npm). This package manager will be used to install dependencies and run scripts. Check that it has been installed with ```npm -v```

<a name="backenddependencies"></a>
### Installing dependencies for server
Once npm is installed, navigate to your locally cloned boulderTrimble repo. Follow these steps to install dependencies for the server.
1. ```$ cd webapp/server```  
2. ```$ npm install```  

This should install all packages defined in ```package.json```. The packages are stored in the ```node_modules``` directory.

<a name="startserver"></a>
### Starting server with necessary environment variables
Now that dependencies are installed, we will start the development server along with defining environment variables that the dev server will need. There are two environment variables of interest: ```PORT``` and ```DATABASE_URL```. As the names suggest, we are providing the server with a port and the URL of our local PostgreSQL database.

1. Navigate to the ``` boulderTrimble/webapp/server ``` directory
2. Use the command ```$ PORT=3001 DATABASE_URL='your-database-url' node bin/www```

   ```your-database-url``` should use the following format: ```postgres://user:password@netloc:port/dbname```.  

   Example: If you have the username 'username', the password 'password', the netloc 'localhost', the port 5432 (default), and the dbname 'capstone', the URL would look like so: ```postgres://username:password@localhost:5432/capstone```  

3. The server should start without any confirmations or messages. It is now ready to serve a local webapp/database!

<a name="react"></a>
## Local React App
The local react application holds the frontend of the application, which has a map with markers provided by the backend, which provides pictures that contain markers and more information for each of the markers. This section details how to setup the React Application for development. It is noted that to get full functionality, you will need to follow the guide to set up the ExpressJS API server in tandem.
<a name="reactdependencies"></a>
### Installing Dependencies for React App
1. Follow the instructions for installing node package manager.
2. Once you have npm installed, go to your locally cloned server. From there, navigate to ```boulderTrimble/webapp/server/client```.
3. Use the command ```npm install```.
This should do the same thing as the ExpressJS API server's dependencies instructions, which should install all packages defined in ```package.json```. The packages are stored in the ```node_modules``` directory.

<a name="startreact"></a>
### Starting React Dev Server
The react dev server actually should be being run when the ExpressJS API server is being run, as the ExpressJS server runs a production build of the client and proxies everything onto the frontend server. As such, all we have to do is build the react application before starting the ExpressJS server.

1. Navigate to the ```boulderTrimble/webapp/server/client``` directory
2. Use the command ```npm run build``` to build the client.
3. Follow the steps to build the Local ExpressJS API server.

If you want to run it without the JSExpress API server, then the steps are slightly different. However, note that you will get no markers from doing this in the current build, as the frontend currently depends on the ExpressJS server.

1. Navigate to the ```boulderTrimble/webapp/server/client``` directory.
2. Use the command ```npm run start``` to start the server.

<a name="heroku"></a>
## Heroku
Our deployment environment of choice is Heroku. Heroku is the home of our API server, the production HTML/Javascript, and our database. **Before getting started with Heroku,** there are a few important steps to follow: 

1. Contact Landon to be added as a contributor to the Heroku project. Include the email that is associated with your git account. 
2. Install the Heroku CLI [here](https://devcenter.heroku.com/categories/command-line).  

<a name="pushheroku"></a>
### Pushing builds to Heroku
Once the repo is cloned to your local machine and you have made changes that are ready for production, you can push the changes to Heroku. Follow these steps: 

1. Add the Heroku git remote to your local repository: ```$ heroku git:remote -a fhast-detection``` 
2. ```cd``` to the top level of the repository (boulderTrimble) 
3. Commit & push all your changes to the master branch of GitHub; ensures that origin and Heroku are on the same build 
4. From the top level directory, push the server subdirectory: ```$ git subtree push --prefix webapp/server heroku master```

   *Note*: Heroku requires that the top level of the codebase contains the package.json for the server. The top level directory for boulderTrimble is not the server directory, so we push the server subdirectory instead of doing a traditional push.  

5. The push initiates a build on Heroku. Done! 

<a name="herokuscripts"></a>
### Heroku scripts
To build the client in production, Heroku executes a short set of commands after a push. This makes it easier for the developer; otherwise, the developer would have to build the client code on his local machine before pushing. These commands are found in ```boulderTrimble/webapp/server/package.json``` under ```scripts.heroku-postbuild```.  

<a name="dbheroku"></a>
### Viewing Heroku database contents 
When testing the project and adding new images to the database, it might be worthwhile to SSH into the database and view/modify its contents. Follow these steps to do so: 

1. ```cd``` into the repo on your local machine
2. Use the command ```$ heroku pg:psql```
3. Now you can view the contents of the database. For example,  

~~~sql
SELECT * FROM images;
~~~ 

<a name="contact"></a>
## Contact
If there any questions, please email the CU Capstone Google Group. Each team member will be notified of the email. 

<a name="acknowledgements"></a>
## Acknowledgements
We would like to give thanks to the following sources.  Our team greatly appreciated their publically available insight and utilities.

[TensorFlow Object Detection API](https://github.com/tensorflow/models/tree/master/research/object_detection)

[How to deploy an Object Detection Model with TensorFlow serving](https://medium.freecodecamp.org/how-to-deploy-an-object-detection-model-with-tensorflow-serving-d6436e65d1d9) by Gaurav Kaila

<a name="contact"></a>
## License 
*Galen TODO*  

