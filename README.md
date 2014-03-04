
# File Manager Proposal
  * **Author:** Leon Gilyadov
  * **Last update:** 28 January 2014

## Swift File Manager

File Manager is an open source web application. All code is client
side. The backend is the Swift v1 API. It is used and called directly
from the client side. Authentication specified in Swift v1 API is
used. File Manager provides UI for all Swift v1 API capabilities.
Deleting entire Container or Pseudo-Directory with its files is
allowed, although swift does not support it in one transaction. Text
files can be edited with advanced capabilities like syntax
highlighting, Cloud9 ACE JavaScript library is used. The code is
readable. Web standards are used. Two latest versions of five most
popular desktop browsers are supported. Latest versions of the most
popular mobile browsers are supported.

## Zwift File Manager

Modified version of Swift File Manager that provided UI for all Zwift
API capabilities. Experimental features will be in additional
separated version.

## Installing File Manager

TODO: figure out how to install Swift with File Manager.

## Creating account

File Manager has no ability to create an account. Because File Manager
is using only Swift v1 API as a backend, which has no option to create
an account.

## Changing Logo

Every screen has a place for a logo. Instead of logo image, there is a
text: 'File Manager'. It can be easily replaced in the HTML code. In
most cases it should be located relatively top-left.

## Authentication form screen

The first screen in File Manager is authentication form. It contains
following fields: Host URL, X-Auth-User (divided into tenant and
user), X-Auth-Key. When is the form filled correctly and 'submit'
button clicked or 'enter' key typed, the Containers List screen is
opened. If the form is filled incorrectly and submitted, then a
relevant error with instructions is presented.

## Screens
  * Authentication
  * Containers
  * Files
  * Editor
  * Non text file options

## Account name and sign out button

When the user is logged in, all screens show the account name and a
sign out button. Clicking on sign out button is moving the user to the
authentication screen. In most cases it should be located relatively
top-right.

Navigation bar and Toolbar

Navigation bar consists of Up Button and Current Path.

There is a toolbar on some screens. The buttons visible on the toolbar
depend on screen. On containers screen the following toolbar buttons
are visible: Create Container Button, Wide Button. On files screen the
following toolbar buttons are visible: Create Directory, Create File,
Upload Files, Upload As.

## Create Container Form

Create container form has container name input field, ok button,
cancel buttons, error label. A valid container name is minimum length
1 and maximum length 256 bytes. Entering a valid container name and
submitting the form adds a new container to the list. A relevant
message is presented in the following cases: invalid input, container
already exist, HTTP error.

## Create Directory Form

Create directory form consists of: Directory Name Field, OK Button,
Cancel Button, Error Label. Allowed input length is 1-1024 bytes.

## Create File Form

Create file form consists of: File Name Field, File Type ("text/plain"
is the default value), OK Button, Cancel Button, Error Label. Allowed
name input length is 1-1024 bytes.

## Uploading Files Area

List of files to upload (after upload as). File name field, file type
field, cancel button, ok button.

List of uploading files with progress bars. File name label, progress
bar, cancel button.

Containers List and Files List

There is a list on containers screen and files screen. The list is
presented only if there are files to show. Otherwise, a message and a
button with action that will allow to add new items to the list. Each
item on the list is a row. Each row has five columns: icon, container
/ file name, size, number of file in container / last time file is
modified, menu icon button.

Empty containers / files list has an icon button positioned on center
of the screen that lets create a container / upload files.

There is a message: "Container size and files amount are not updated
immediately. Because Swift is eventually consistent." and "hide"
button that allow to hide the message.

## Deleting Container

How to delete? Look at container you want to delete. Click on menu
icon. Click on delete icon in the menu. Confirm delete form is opened.
Clicking on "Confirm Delete" will open progress bar. Deleting
container that has files is allowed although Swift does not allow to
do it in one transaction.

## List screen UI widgets hierarchy

  * 1. Page
  * 1.1. Header
  * 1.1.1. Row1
  * 1.1.1.1. Logo
  * 1.1.1.2. Account
  * 1.1.1.2.1. AccountId
  * 1.1.1.2.2. SignOutButton
  * 1.1.2. Row2
  * 1.1.2.1. Navigation
  * 1.1.2.1.1. UpButton
  * 1.1.2.1.2. NavigationBar
  * 1.1.2.2. Toolbar
  * 1.1.2.2.1. CreateContainer
  * 1.1.2.2.2. CreateDirectory
  * 1.1.2.2.3. CreateFile
  * 1.1.2.2.4. UploadFiles
  * 1.1.2.2.5. UploadAs
  * 1.1.2.2.6. Wide
  * 1.1.3. Row3
  * 1.1.3.1. CreateContainerForm
  * 1.1.3.2. CreateDirectoryForm
  * 1.1.3.3. CreateFileForm
  * 1.2. NoContainers
  * 1.3. NoFiles
  * 1.4. List
  * 1.5. Editor
  * 2. Authentication
