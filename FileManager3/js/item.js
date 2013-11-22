(function(){
	"use strict";

	var selectedPath = null,
		previousParent,
		appearClass = "appear-submenu",
		submenu = new Submenu();

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

	function deleteclick(el){
		var itemConfirmDelete = document.querySelector('#itemConfirmDeleteTemplate').innerHTML;
		var itemEl = el.parentNode.parentNode;
		itemEl.classList.add('clicked');
		itemEl.insertAdjacentHTML('afterend', itemConfirmDelete);
	}

	function showLoading(itemEl){
		var loadingHtml = document.querySelector('#itemLoadingTemplate').innerHTML;
		itemEl.classList.add('clicked');
		itemEl.insertAdjacentHTML('afterbegin', loadingHtml);
	}

	function toggleMenu(e){
		var parent = FileManager.toolbox.getParentByClassName(e, 'item');
		if(previousParent === parent){
			submenu.wrapper.classList.toggle(appearClass)
		}else{
			previousParent = parent;
			submenu.wrapper.classList.remove(appearClass);
			submenu.wrapper.parentNode && removeSubmenu();
			submenu.setPath(parent.dataset.path);
			appendSubmenu(parent);
			setTimeout(function(){
				submenu.wrapper.classList.add(appearClass);
			}, 0);
		}

	}

	function appendSubmenu(parentEl){
		parentEl.parentNode.insertBefore(submenu.wrapper, parentEl.nextSibling);
		setTimeout(function(){
			submenu.wrapper.classList.add(appearClass);
		}, 0);
	}

	function removeSubmenu(){
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
				},
				oncopy: function(e){
				},
				onmetadata: function(e){
				},
				ontype: function(e){
				},
				ondelete: function(e){
				},
				onexecute: function(e){
				},
				onedit: function(e){
					onItemClick(previousParent);
				}
			};

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

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.Item = {
		selectedPath: selectedPath,
		click: onItemClick,
		deleteclick: deleteclick,
		showLoading: showLoading,
		toggleMenu: toggleMenu
	};
})();