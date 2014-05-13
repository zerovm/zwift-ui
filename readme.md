File Manager
============

File Manager is a web UI for Zwift (https://github.com/zerovm/zerocloud) and for OpenStack Swift. It is open source.

Installation
------------

Assuming that Swift/Zwift is already installed, there are two options to install File Manager:

1. Install it on apache or any other web frontend just by copying all the files under any URL. The only requirement is that the URL domain part of the URL should be the same as Swift URL.
I.e. if Swift is under "https://something.domain.org/v1/" then FileManager should be: "https://something.domain.org/some/other/url"

2. Install it by copying it into your account on Swift. Can be accomplished by command line tool, for example.
I.e. `swift -A https://auth/url -U mytenenat:myuser -K mypassword upload file_manager_container file/manager/path/on/local/disk

Configuration
-------------

### config.js.sample

1. Copy "config.js.sample" file into "config.js".
2. Change the auth endpoint.

### Enable and Disable Execute Feature

The Execute feature can be enabled/disabled by changing the following variable in FileManager.js file:
```
FileManager.ENABLE_ZEROVM = true;
```

Supported Browsers
------------------

Last time tested on:
* Chrome 34
* Firefox 29
* Safari 7

License
-------

Apache License - Version 2.0

Files Description
-----------------

* Swift.js - implementation in JavaScript of Swift V1 API (http://docs.openstack.org/api/openstack-object-storage/1.0/content/) and Zwift (https://github.com/zerovm/zerocloud).
* FileManager.js - The UI itself.
* liteauth.js - implementation in JavaScript of Liteauth (https://github.com/zerovm/liteauth)

Third-party dependencies
------------------------

* CodeMirror (http://codemirror.net/) - JavaScript library used for the editor.

Backend
-------

* OpenStack Swift - https://github.com/openstack/swift
* Zwift - https://github.com/zerovm/zerocloud
* Liteauth - https://github.com/zerovm/liteauth

Screenshots
-----------

![1](screenshots/1.png)
![2](screenshots/2.png)
![3](screenshots/3.png)

Features
--------
* view containers list
   * view container size (sometimes this information is not accurate because Swift is eventually consistent)
   * view number of files in a container (sometimes this information is not accurate because Swift is eventually consistent)
   * list a limited number of containers (when the page is scrolled down or "load more" button is clicked, more containers are loaded)
* create container
* delete container
  * ability to delete a container that contains files (which is not done in a single transaction, because Swift V1 API does not allow you to delete container that contains files)
* change container metadata
* change container rights
* view files list
  * know the file type (there are many icons for various file types)
  * view file size
  * see when the file was last changed
  * view pseudo-directories
  * list a limited number of files (when the page is scrolled down or "load more" button is clicked, more files are loaded)
* create pseudo-directory: this is done by creating a file with content type "application/directory", which is specified using the Swift V1 API
* create file
  * ability to choose a content type for the file when creating it
* upload files
  * ability to upload multiple files
  * progress bar with percentage that indicates how much has been uploaded
  * cancel upload option
* upload as: ability to choose file name file content type before uploading it
* upload and execute: execute is enabled by Zwift middleware (https://github.com/zerovm/zerocloud) for Swift
* delete files and pseudo-directories
  * ability to delete pseudo-directory that contains files (which is not done in a single transaction, because Swift V1 API does not allow you to delete a pseudo-directory that contains files)
* change file content type
* change metadata of a file and pseudo-directory
* edit text file
  * line numbers
  * syntax highlighting for several programming languages
  * undo and redo
  * save file changes
  * save as
  * download the file
  * JSON and python files: execute (requires Zwift)
  * open (type of execution); requires Zwift
* The user can navigate in File Manager by clicking on containers, directories, files, and clicking on "up" button.
  * back and forward buttons in the browser are supported
