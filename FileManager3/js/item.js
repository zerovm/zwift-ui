(function(){
	"use strict";

	var selectedPath = null;

	function onclick(itemEl){
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
		console.log(FileManager.toolbox.getParentByClassName(e, 'item'))
	}

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.Item = {
		selectedPath: selectedPath,
		click: onclick,
		deleteclick: deleteclick,
		showLoading: showLoading,
		toggleMenu: toggleMenu
	};
})();