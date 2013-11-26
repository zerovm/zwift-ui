(function(){
	"use strict";

	var selectedPath = null,
		previousParent,
		appearClass = "appear-submenu",
		submenu = new Submenu(),
		loadingHtml,
		progressObj;

	function onItemClick(itemEl){
		var name = itemEl.dataset.path;
		if(!name){
			return;
		}
		selectedPath = FileManager.CurrentPath().add(name);
		FileManager.Loading.hide();
		FileManager.Item.showLoading(itemEl);
		location.hash = selectedPath;
	}

	function ajaxError(status, statusText){
		window.FileManager.elements.mainProgressBar.classList.remove(window.FileManager.elements.hiddenClass);
		window.FileManager.errorMsgHandler.show({
			header: "Ajax error:",
			status: status,
			statusText: statusText
		});
	}

	function copy(){
		var copyTo = document.querySelector('.copy-input').value;

		function ajaxError(status, statusText){
			window.FileManager.errorMsgHandler.show({
				header: "Error:",
				status: status,
				statusText: statusText
			})
		}

		if(FileManager.ENABLE_SHARED_CONTAINERS && FileManager.Shared.isShared(FileManager.Item.selectedPath)){
			SharedContainersOnSwift.copy({
				account: FileManager.Path(copyTo).account(),
				path: FileManager.Path(copyTo).withoutAccount(),
				copyFrom: FileManager.Path(FileManager.Item.selectedPath).get(),
				copied: window.FileManager.files.addFileListContent,
				error: ajaxError
			});
			return;
		}

		SwiftV1.copyFile({
			path: FileManager.Path(copyTo).withoutAccount(),
			copyFrom: FileManager.Path(FileManager.Item.selectedPath).withoutAccount(),
			copied: window.FileManager.files.addFileListContent,
			error: ajaxError
		});
	}

	function deleteItem(el){
		var name = el.dataset.path,
			itemPath = FileManager.CurrentPath().add(name);
		if(FileManager.ENABLE_SHARED_CONTAINERS
			&& FileManager.Shared.isShared(itemPath)
			&& el.dataset.type === "container"){
			SharedContainersOnSwift.removeSharedContainer({
				account: FileManager.Path(name).account(),
				container: FileManager.Path(name).container(),
				removed: function(){
					window.FileManager.files.addFileListContent();
				},
				error: ajaxError
			});
			return;
		}
		if(el.dataset.type === "file"){
			SwiftAdvancedFunctionality.delete({
				path: FileManager.Path(itemPath).withoutAccount(),
				deleted: function(){
					window.FileManager.files.addFileListContent();
				},
				error: ajaxError,
				notExist: function(){
					window.FileManager.files.addFileListContent();
				}
			});
			return;
		}

		window.FileManager.elements.mainProgressBar.classList.remove(window.FileManager.elements.hiddenClass);
		//progressObj = new window.FileManager.toolbox.ProgressBar()
		SwiftAdvancedFunctionality.deleteAll({
			path: FileManager.Path(itemPath).withoutAccount(),
			account: FileManager.CurrentPath().account(),
			deleted: function(){
				window.FileManager.files.addFileListContent();
				window.FileManager.elements.mainProgressBar.classList.add(window.FileManager.elements.hiddenClass);
			},
			progress: function(totalFiles, deletedFiles, message){
				totalFiles = totalFiles - 1;
				var percentComplete = deletedFiles / totalFiles * 100;
				console.log('Deleting... (' + deletedFiles + '/' + totalFiles + ') ' + percentComplete + '% complete.');
			},
			error: ajaxError
		});
	}

	function showLoading(itemEl){
		itemEl.classList.add('clicked');
		itemEl.insertAdjacentHTML('afterbegin', loadingHtml);
	}

	function toggleMenu(e){
		var parent = FileManager.toolbox.getParentByClassName(e, 'item');
		if(previousParent === parent){
			submenu.wrapper.classList.toggle(appearClass)
		}else{
			submenu.wrapper.classList.remove(appearClass);
			submenu.wrapper.parentNode && removeSubmenu();
			submenu.setPath(parent.dataset.path);
			appendSubmenu(parent);
			setTimeout(function(){
				submenu.wrapper.classList.add(appearClass);
			}, 0);
		}
		previousParent = parent;
	}

	function appendSubmenu(parentEl){
		parentEl.parentNode.insertBefore(submenu.wrapper, parentEl.nextSibling);
		setTimeout(function(){
			submenu.wrapper.classList.add(appearClass);
		}, 0);
	}

	function removeSubmenu(){
		previousParent = null;
		submenu.wrapper.classList.remove(appearClass);
		submenu.wrapper.parentNode.removeChild(submenu.wrapper);
	}

	function Submenu(){
		var button, wrapper, path,
			buttonsClass = "submenu-items",
			actionPrefix = "on",
			handlers = {
				onopen: function(e){
				},
				ondownload: function(e){
					var clickEvent = document.createEvent("MouseEvent"),
						a = document.createElement("a");
					clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
					a.href = window.FileManager.elements.originalPath + FileManager.CurrentPath().get() + previousParent.dataset.path;
					a.download = previousParent.dataset.path;
					a.dispatchEvent(clickEvent);
				},
				oncopy: copy,
				onmetadata: function(e){
				},
				ontype: function(e){
				},
				ondelete: function(e){
					window.FileManager.dialogForm.show({
						confirm: function(){
							deleteItem(previousParent);
						},
						dialogContent: createDialog(),
						type: "dialog"
					});
				},
				onexecute: function(e){
				},
				onedit: function(e){
					onItemClick(previousParent);
				}
			};

		function createDialog(){
			var textEl = document.createElement("span"),
				fragment = document.createDocumentFragment();
			textEl.innerHTML = "Are you sure of deleting&nbsp;";
			fragment.appendChild(textEl);
			textEl = document.createElement("strong");
			textEl.textContent = previousParent.dataset.path + "?";
			fragment.appendChild(textEl);
			return fragment;
		}

		this.setPath = function(p){
			path = p;
		};

		this.wrapper = wrapper = document.createElement("div");
		wrapper.className = "item submenu no-hover no-active";

		Object.keys(handlers).forEach(function(className){
			className = className.replace(actionPrefix, "");
			button = document.createElement("button");
			button.className = className + " " + buttonsClass;
			button.title = className;
			button.dataset.action = className;
			wrapper.appendChild(button);
		});
		wrapper.addEventListener("click", function(e){
			var actionEl = FileManager.toolbox.getParentByClassName(e.target, buttonsClass),
				handler;
			e.preventDefault();
			e.stopPropagation();
			if(actionEl){
				handler = actionPrefix + actionEl.dataset.action;
				handlers[handler] && handlers[handler]();
			}
		});
	}

	document.addEventListener("DOMContentLoaded", function(){
		loadingHtml = document.querySelector('#itemLoadingTemplate').innerHTML;//TODO: replace this s...
	});

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.Item = {
		selectedPath: selectedPath,
		click: onItemClick,
		showLoading: showLoading,
		toggleMenu: toggleMenu
	};
})();