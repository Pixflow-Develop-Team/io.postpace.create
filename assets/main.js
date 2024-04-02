"use strict";

function download(app_folder, element, categoryName, item){     
    var path_item = path.join(app_folder, categoryName, item);
    var target_path = path_item.substring(0, path_item.indexOf("."));
    var $this = element;
    if(fs.existsSync(target_path)){
        import_file(target_path, item, element);
        element.classList.remove("loading");
    }
    else {
        $this.classList.add("loading");
        dl_req = new XMLHttpRequest();
        var el_stop = $this.parentNode.querySelector("div.stop");
        el_stop.classList.add("active");
        el_stop.addEventListener("click", function(){
            $this.classList.remove("loading");
            el_stop.classList.remove("active");
            dl_req.abort();
            flag_download_stop = true;
        })
        var query_data = new URLSearchParams({
            userID: user_id,
            itemID: element.getAttribute("object-id"),
            itemFileName: item,
            isFree: element.getAttribute("free"),
            token: token(),
            source: "plugin",
            itemName: element.getAttribute("item-name"),
            categoryName: element.getAttribute("category-name"),
            userEmail: localStorage.getItem("email"),
            itemSoftware: app_title
        }).toString();
        dl_req.open("post", `https://pixflow.net/wp-json/pixflow/get-element-download-url-postpace-mode?${query_data}`);
        dl_req.addEventListener("load", function(){
            var res = JSON.parse(this.responseText);
            if(false == res.success){
                var ban_dl = document.querySelector("#data div.ban-download");
                ban_dl.querySelector("p").innerHTML = res.data.message;
                message_box("ban-download");
                $this.classList.remove("loading");
                return;
            }
            dl_link = https.get(res.data.result.downloadable_file_url, function (response) {
                if(flag_download_stop){
                    dl_link.abort();
                    return;
                }
                var path_category = path.join(app_folder, categoryName);
                if(fs.existsSync(path_category) == false){
                    fs.mkdirSync(path_category);
                }
                var file = fs.createWriteStream(path_item);
                var len = parseInt(response.headers['content-length'], 10);
                var span = $this.parentNode.querySelector("div:first-child > span:first-child");
                var lpv = document.querySelector("#footer div.loading-percent-view");
                el_stop.addEventListener("click", function(){
                    dl_link.abort();
                    window.__adobe_cep__.evalScript(`File("${path_item.replace(/\\/g,"\\\\")}").remove()`, function(){
                        $this.classList.remove("loading");
                        el_stop.classList.remove("active");
                        span.classList.remove("active");
                        lpv.classList.remove("active");
                        lpv.style.width = 0;
                        download_queue();
                    })
                })
                lpv.classList.add("active");
                span.classList.add("active");
                var cur = 0;
                response.pipe(file);
                var loading = 0;
                response.on("data", function(chunk){
                    cur += chunk.length;
                    loading = parseInt(cur / len * 100);
                    span.innerHTML = `${loading}%`;
                    lpv.style.width = `${loading}%`;
                });
                file.on('finish', function () {
                    if(fs.existsSync(target_path) == false){
                        fs.mkdirSync(target_path);
                    }
                    el_stop.classList.remove("active");
                    var zip = new AdmZip(path_item);
                    zip.extractAllTo(target_path, true);
                    window.__adobe_cep__.evalScript(`File("${path_item.replace(/\\/g,"\\\\")}").remove()`, function(){
                        $this.classList.remove("loading");
                        $this.classList.add("complete");
                        span.classList.remove("active");
                        var new_element = $this.parentNode.parentNode.parentNode.cloneNode(true);
                        new_element.classList.remove("active");
                        element_library_pack.appendChild(new_element);
                        show_info(new_element.querySelector("div.download"), new_element);
                        new_element.querySelector("div.have-guide").addEventListener("click", have_guide_click);
                        new_element.addEventListener("click", item_overall_click)
                        new_element.querySelector("div.thumbnail").addEventListener("mouseenter", video_mouse_enter)
                        new_element.querySelector("div.thumbnail").addEventListener("mouseleave", video_mouse_leave)
                        new_element.querySelector("div.download").addEventListener("click", download_click)
                        new_element.querySelector("div.thumbnail").addEventListener("dblclick", video_dblclick)
                        lpv.classList.remove("active");
                        lpv.style.width = 0;
                        message_path($this, target_path);
                        show_info($this, $this.parentNode.parentNode.parentNode);
                        download_queue();
                    })
                });
            })
        })
        dl_req.send();
    }
}

function message_path(el, target_path){
    if(el.getAttribute("is-lut") == "true"){
        document.querySelector("#data div.path-lut span.target-path").innerHTML = target_path.split(platform == "Windows" ? "\\" : "/").join(" / ");
        document.querySelector("#data div.path-lut span.item-name").innerHTML = `"${el.getAttribute("item-name")}"`;
        message_box("path-lut")
    }
}

function import_file(path_folder, item, el){
    if(fs.existsSync(path_folder) == false)
        return false;
    var is_lut = el.getAttribute("is-lut");
    var files = fs.readdirSync(path_folder);
    var ftype = init_data["filters"]["fileTypes"];
    var filter = files.filter(function(value){
        for(var i = 0; i < ftype.length; i++){
            var v = is_lut == "true" ? "cube" : ftype[i].toLowerCase();
            if(value.indexOf(v) > 0)
                return true;
        }
        return false;        
    });
    filter.forEach(function(value){
        var path_file = path.join(path_folder,value);
        if(platform == "Windows"){
            path_file = path.join(path_folder,value).replace(/\\/g, "\\\\");
            path_folder = path_folder.replace(/\\/g, "\\\\");
        }
        var cmd;
        const file_type = path_file.substring(path_file.lastIndexOf(".") + 1);
        switch(appName){
            case "ILST": /* The look like PHXS */
            case "PHXS": cmd = `open(File("${path_file}"))`; break;
            case "PPRO":
                if(file_type == "mogrt")
                    cmd = `app.project.activeSequence.importMGT("${path_file}", 0, 0, 0)`;
                else
                    cmd = `app.project.importFiles("${path_file}")`;
                break;
            case "AEFT":
                if(is_lut == "true"){
                    window.__adobe_cep__.evalScript("app.project.activeItem", function(result){
                        if(result == "null"){
                            message_box("select-composition");
                        } else {
                            message_path(el, path_folder);
                            setTimeout(() => {
                                window.__adobe_cep__.evalScript(`var l = app.project.activeItem.layers.addSolid([0,0,0], "${el.getAttribute("item-name")}", app.project.activeItem.width, app.project.activeItem.height, 1);`
                                + `l.adjustmentLayer = true;`
                                + `app.project.setDefaultImportFolder(new Folder("${path_folder}"));`
                                + `l.Effects.addProperty("ADBE Apply Color LUT2");`, function(){});                                    
                            }, 500);
                        }
                    })
                } else {
                    var import_as_type = file_type == "aep" ? "ImportAsType.PROJECT" : "ImportAsType.FOOTAGE";
                    cmd = `var file = File("${path_file}"); app.beginSuppressDialogs(); var io = new ImportOptions(file); io.canImportAs(${import_as_type});`
                    + `io.importAs = ${import_as_type}; var footage = app.project.importFile(io); app.endSuppressDialogs(false);`;
                }
                break;
        }
        window.__adobe_cep__.evalScript(cmd, function(){});
    })
    if(!filter.length){
        path_folder = path.join(path_folder, item);
        if(fs.existsSync(path_folder))
            import_file(path_folder, item, el);
        return false;        
    }
}

function filters(params){
    var temp = JSON.parse(JSON.stringify(params));
    var query = "";
    if(temp.px_element_file_type.length > 0){
        query = "(";
        temp.px_element_file_type.forEach(function(extension, index){
            temp.px_element_file_type[index] = `px_element_file_type:"${extension}"`
        });
        query += temp.px_element_file_type.join(" OR ")
        query += ")";        
    }
    if(temp.px_element_main_categories.length){
        if(temp.px_element_file_type.length)
            query += " AND ";
        query += "(";
    }
    temp.px_element_main_categories.forEach(function(category, index){
        temp.px_element_main_categories[index] = `px_element_main_category:"${category}"`
    });
    query += temp.px_element_main_categories.join(" OR ");
    if(temp.px_element_main_categories.length)
        query += ")";
    if(temp.px_element_video_qualities.length){
        if(temp.px_element_file_type.length || temp.px_element_main_categories.length)
            query += " AND "
        query += "(";
    }
    temp.px_element_video_qualities.forEach(function(quality, index){
        temp.px_element_video_qualities[index] = `px_element_video_quality:"${quality}"`
    });
    query += temp.px_element_video_qualities.join(" OR ");
    if(temp.px_element_video_qualities.length)
        query += ")";
    if(temp.px_element_free_item == true){
        if(query.length)
            query += " AND ";
        query += "( px_element_free_item:true )";
    }
    return query;
}

function path_folder(is_lut){
    return is_lut == "true" ? lut_folder : app_folder;
}

function show_info(item, parent){
    var dl = item.getAttribute("downloadable-file");
    if(
        item.getAttribute("have-guide") == "true" &&
            fs.existsSync(path.join(
                path_folder(item.getAttribute("is-lut")),
                item.getAttribute("category-name"),
                dl.substring(0, dl.indexOf("."))
        ))
    )
        parent.querySelector("div.have-guide > img").classList.add("active");
}

function generate_item(item){
    if(item == null)
        return;
    var host = "https://fra1.digitaloceanspaces.com/pixflow-storage/pixflow-element-";
    var host_thumbnails = `${host}thumbnails/`;
    var host_videos = `${host}videos/`;
    var thumb = document.querySelector("#data > div.item").cloneNode(true);
    var video = thumb.querySelector("div.thumbnail video");
    var thumbnail_filename = `${host_thumbnails}${item.px_element_thumbnail_file_name}`;
    video.setAttribute("poster", thumbnail_filename);
    video.querySelector("source").setAttribute("src", `${host_videos}${item.px_element_video_file_name}`);
    if(item.px_element_have_new_tag == true)
        thumb.querySelector("div.tag div.new").classList.add("active");
    if(item.px_element_free_item == true)
        thumb.querySelector("div.tag div.free").classList.add("active");
    thumb.querySelector("span.title").innerHTML = item.title;
    var categories = item.px_element_main_category;
    var arr_categories = [];
    item.px_element_categories.forEach(function(value){
        if(value != null && value.trim() != "")
            arr_categories.push(value);
    })
    if(arr_categories.length)
        categories = arr_categories.join(",");
    thumb.querySelector("span.categories").innerHTML = categories;
    var element_dl = thumb.querySelector("div.download");
    element_dl.setAttribute("object-id", item.objectID);
    element_dl.setAttribute("have-guide", item.px_element_have_guide);
    element_dl.setAttribute("category-name", item.px_element_main_category);
    element_dl.setAttribute("item-name", item.title);
    var main_folder = item.px_element_software == "LUT" ? lut_folder : app_folder;
    var path_item = path.join(main_folder, item.px_element_main_category, item.px_element_downloadable_file);
    var target_path = path_item.substring(0, path_item.indexOf("."));
    var dl = item.px_element_downloadable_file;
    element_dl.setAttribute("downloadable-file", dl);
    element_dl.setAttribute("free", item.px_element_free_item);
    var is_lut = item.px_element_software == "LUT";
    element_dl.setAttribute("is-lut", is_lut);
    show_info(element_dl, thumb);
    if(fs.existsSync(target_path)){
        element_dl.classList.add("complete");
    }
    return thumb;
}

function generate_library(item){
    var main_folder = item.px_element_software == "LUT" ? lut_folder : app_folder;
    var path_item = path.join(main_folder, item.px_element_main_category, item.px_element_downloadable_file);
    var target_path = path_item.substring(0, path_item.indexOf("."));
    if(fs.existsSync(target_path)){
        element_library_pack.appendChild(generate_item(item).cloneNode(true));
    }
}

function have_guide_click(e){
    var item = e.target.parentNode.parentNode.parentNode;
    var dl = item.querySelector("div[downloadable-file]").getAttribute("downloadable-file");
    var path_guide = "file:///" + path.join(
        path_folder(item.querySelector("div[is-lut]").getAttribute("is-lut") == "true"),
        item.querySelector("div[category-name]").getAttribute("category-name"),
        dl.substring(0, dl.indexOf(".")),
        "Guide.pdf"
    ).replace(/\\/g,"/");
    window.cep.util.openURLInDefaultBrowser(path_guide);
}

function header_click(){
    const obj_active = document.querySelector("#main > div.item.active");
        if(obj_active)
            obj_active.classList.remove("active");
}

function item_overall_click(e){
    const obj_active = document.querySelector("#main > div.item.active, #library-pack > div.item.active");
    if(obj_active)
        obj_active.classList.remove("active");
    var item = e.target.closest("div.item");
    item.classList.add("active");
}

function video_mouse_enter(e){
    var video = e.target.parentNode.querySelector("video");
    var poster = video.getAttribute("poster");
    var source = video.querySelector("source").getAttribute("src");
    if(poster.substring(poster.lastIndexOf("/")) != source.substring(source.lastIndexOf("/"))){
        video.currentTime = 0;
        video.play();
    }
}

function video_mouse_leave(e){
    var video = e.target.parentNode.querySelector("video");
    video.pause();
    video.currentTime = 0;
}

function video_dblclick(e){
    var item = e.target.parentNode.parentNode;
    var dl = item.querySelector("div.download");
    var dlfile = dl.getAttribute("downloadable-file");
    import_file(path.join(app_folder, dl.getAttribute("category-name"), dlfile.substring(0, dlfile.indexOf("."))), item, dl);
}

function filter_view(index, params){
    element_loading.classList.add("active");
    index.search(params.search,{
        "hitsPerPage" : 2000,
        "filters" : filters(params),
        "optionalFilters": params.optionalFilters
        }).then(function({ hits }){
            offset = 0;
            limit = inc;
            element_main.querySelectorAll("div.item").forEach(function(element){
                element.remove();
            })
            if(document.querySelector("#main div.msg-no-item") != null){
                document.querySelector("#main div.msg-no-item").remove();
            }
            if(hits.length) {
                if(element_search.value){
                    var log_search = new XMLHttpRequest();
                    var query_data = new URLSearchParams({
                        keyword: filter_params.search,
                        category: filter_params.px_element_main_categories,
                        fileType: filter_params.px_element_file_type.filter(function(value, index, array){
                            return array.indexOf(value) === index;
                        }),
                        software: app_title,
                        resolution: filter_params.px_element_video_qualities.join(","),
                        resultCount: hits.length,
                        source: "plugin"
                    });
                    log_search.open("post", `https://pixflow.net/wp-json/pixflow/log-search-data-to-database?${query_data}`)
                    log_search.send();
                }
                element_main.scrollTop = 0;
                items = hits;
                items.forEach(function(item){
                    element_main.appendChild(generate_item(item));
                    if(!is_generate_library){
                        generate_library(item);
                    }
                })
                is_generate_library = true;
                /* render_items_limit(items);
                if(!is_generate_library){
                    items.forEach(function(item){
                        generate_library(item);
                    })
                    is_generate_library = true;
                } */
                for(var i = 1; i < 9; i++){
                    const video = document.querySelector(`div.item:nth-child(${i}) video`);
                    if(video != null)
                        video.setAttribute("preload", "auto");
                    else
                        break;
                }
                setTimeout(() => {
                    document.querySelectorAll("#main div.placeholder-loading, #library-pack div.placeholder-loading").forEach(element => element.remove());
                }, 5000);
                if(pixflow_banner != null)
                    pixflow_banner.show();
                element_loading.classList.remove("active");
                element_loading.querySelector("div.load-user-library").classList.remove("active");
                document.querySelector("#header").addEventListener("click", header_click);
                document.querySelectorAll("#main > div.item").forEach(function(element){
                    element.addEventListener("click", item_overall_click)
                })
                document.querySelectorAll("#library div.have-guide, #main div.have-guide").forEach(function(element){
                    element.addEventListener("click", have_guide_click)
                })
                document.querySelectorAll("div.thumbnail").forEach(function(element){
                    element.addEventListener("mouseenter", video_mouse_enter)
                    element.addEventListener("mouseleave", video_mouse_leave)
                });
                document.querySelectorAll("div.item div.download").forEach(function(element){
                    element.removeEventListener("click", download_click)
                })
                document.querySelectorAll("div.item div.download").forEach(function(element){
                    element.addEventListener("click", download_click)
                })
                document.querySelectorAll("#main > div.item > div.thumbnail, #library div.item > div.thumbnail").forEach(function(element){
                    element.addEventListener("dblclick", video_dblclick)
                })
            }
            else {
                var msg = document.querySelector("#data > div.msg-no-item").cloneNode(true);
                if(pixflow_banner != null)
                    pixflow_banner.classList.remove("active");
                element_main.appendChild(msg);
                element_loading.classList.remove("active");
            }
    });    
}

function render_items_limit(items){
    for(var i = offset; i < limit; i++){
        if(items[i] != null)
            element_main.appendChild(generate_item(items[i]));
        else
            return;
    }
}

/* document.querySelector("#main").addEventListener("scroll", function(e){
    const item = document.querySelector("#main > div.item");
    const item_client_height = item.clientHeight;
    const cnt_item = Math.floor(element_main.clientHeight / item_client_height);
    const max = Math.ceil(this.scrollHeight - (cnt_item + 1) * item_client_height);
    console.log(JSON.stringify({
        scrollTop: this.scrollTop,
        scrollHeight: this.scrollHeight,
        item_client_height: item_client_height,
        inc: inc,
        offset: offset,
        limit: limit,
        cnt_item: cnt_item,
        max: max
    }));
    if(this.scrollTop > max){
        offset += limit;
        limit += inc;
        render_items_limit(items);            
    }
});
 */

function download_click(e){
    if(localStorage.getItem("postpace_user_type") == "free" && e.target.getAttribute("free") == "false"){
        go_premium_click();
    } else {
        var dl = e.target;
        var dlfile = dl.getAttribute("downloadable-file");
        var item = dlfile.substring(dlfile.lastIndexOf("/"));
        if(e.target.classList.contains("complete")){
            if(appName == "PPRO"){
                window.__adobe_cep__.evalScript("app.project.activeSequence", function(result){
                    if(result == "null"){
                        message_box("no-sequence");
                    } else {
                        import_file(path.join(app_folder, dl.getAttribute("category-name"), dlfile.substring(0, dlfile.indexOf("."))), item, dl);
                    }
                })    
            } else {
                import_file(path.join(app_folder, dl.getAttribute("category-name"), dlfile.substring(0, dlfile.indexOf("."))), item, dl);
            }
        }
        else if(dl.classList.contains("download")){
            dl.classList.add("loading");
            download_queue();
        }
    }
}

function filter_view_extension(index){
    const tag_filter = document.querySelector("#tag-filter > div.active");
    document.querySelector("#tag-filter-button > div").innerHTML = tag_filter.querySelector("div:first-child").innerHTML;
    const tag_filter_id = tag_filter.id;
    if(tag_filter_id == "tag-free")
        filter_params.px_element_free_item = true;
    else
        filter_params.px_element_free_item = false;
    if(filter_params.px_element_file_type.indexOf("CUBE") >= 0){
        filter_params.px_element_file_type.push("LUT");
    }
    filter_view(index, filter_params);
}

function token(){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yy = today.getFullYear().toString().substring(2);
    return `${dd}${mm}${yy}`;
}

function search_items(element){
    download_stop();
    filter_params.search = element.value;
    filter_view_extension(document.querySelector("#tag-filter > div.active").id == "tag-trending" ? index_trending : index);
    element_categories.closeWindow();
    element_block.closeWindow();
    btn_delete.disabled = true;
    setTimeout(() => {
        element_search_tools.classList.remove("active");
    }, 300);
}

function download_stop(){
    flag_download_stop = true;
    if(dl_req instanceof XMLHttpRequest)
        dl_req.abort();
    if(typeof dl_link == 'object'){
        dl_link.end();
    }
    var lpv = document.querySelector("#footer div.loading-percent-view");
    lpv.classList.remove("active");
    lpv.style.width = 0;
    var dl = document.querySelector("#main div.download.loading, #library-pack div.download.loading");
    if(dl != null)
        dl.classList.remove("loading");
}

function find_bubble(words){
    var categories = element_categories.querySelectorAll("div.catpack");
    words.forEach(function(element){
        categories.forEach(function(value){
            var found = value.querySelector("span").innerHTML.toLowerCase() == element.toLowerCase();
            var deselect = value.querySelector("div.deselect");
            if(found){
                if(!value.classList.contains("active")){
                    value.classList.add("active");
                    deselect.classList.add("active");    
                }
            } else {
                value.classList.remove("active");
                deselect.classList.remove("active");
            }
        })
    })
}

function generate_checkbox(arr, el, col){
    var index = 0;
    for(var key in arr){
        var new_checkbox_batch = null;
        if(index % col == 0){
           new_checkbox_batch = document.querySelector("#data div.checkbox-batch").cloneNode(true);
           document.getElementById(el).appendChild(new_checkbox_batch);
        } else {
            new_checkbox_batch = document.querySelector(`#${el} div.checkbox-batch:last-child`);
        }
        var new_extension = document.querySelector("#data div.extension").cloneNode(true);
        new_extension.querySelector("input").id = arr[key];
        var label = new_extension.querySelector("label");
        label.setAttribute("for", arr[key]);
        label.innerHTML = arr[key];
        new_checkbox_batch.appendChild(new_extension);
        index++;
    }
}

function set_filter_params(){
    document.querySelectorAll("#categories-filter > div.catpack").forEach(function(element){
        if(filter_params.px_element_main_categories.indexOf(element.querySelector("span").innerHTML) >= 0){
            element.classList.add("active");
            element.querySelector("div.deselect").classList.add("active");
        } else {
            element.classList.remove("active");
            element.querySelector("div.deselect").classList.remove("active");
        }
    })
    document.querySelectorAll("#file-type div.extension input").forEach(function(element){
        if(filter_params.px_element_file_type.length == init_data.filters.fileTypes.length){
            element.checked = false;
        } else {
            if(filter_params.px_element_file_type.indexOf(element.id) >= 0){
                element.checked = true;
            } else {
                element.checked = false;
            }    
        }
    })
    document.querySelectorAll("#quality div.extension input").forEach(function(element){
        if(filter_params.px_element_video_qualities.indexOf(element.id) >= 0){
            element.checked = true;
        } else {
            element.checked = false;
        }
    })
}

function download_queue(){
    flag_download_stop = false;
    if(document.querySelector("#main div.item div.status span.active, #library-pack div.item div.status span.active") == null){
        var element = document.querySelector("#main div.download.loading, #library-pack div.download.loading");
        if(element != null)
            download(path_folder(element.getAttribute("is-lut")), element, element.getAttribute("category-name"), element.getAttribute("downloadable-file"));
    }
}

function message_box(id, func){
    var el = document.querySelector(`#data div.${id}`).cloneNode(true);
    el.classList.add("message-box");
    el.id = id;
    document.body.appendChild(el);
    element_block.openWindow();
    element_block.classList.add("full-cover");
    el.classList.add("active");
    setTimeout(() => {
        if(typeof func == "function")
            func.call(this);
        el.classList.add("fade");
    }, 310);
    el.querySelector("button.got-it").addEventListener("click", got_it_click)
    block.addEventListener("click", function(){
        el.classList.remove("fade");
        setTimeout(() => {
            el.classList.remove("active");
            el.remove();
            block.addEventListener("click", block_click);
        }, 300);    
    })
    return el;
}

function got_it_click(e){
    var main = e.target.parentNode.parentNode;
    main.classList.remove("fade");
    element_block.closeWindow();;
    setTimeout(() => {
        element_block.classList.remove("full-cover");
        main.classList.remove("active");
        main.remove();
    }, 300);
}

require("window-element");
require("notification-element");
require("pixflow-banner");
const pixflow_banner = document.querySelector("pixflow-banner");
const CepManifest = require("pixflow-cep-manifest");
const cep_manifest = new CepManifest();
const Logout = require("pixflow-logout");
const logout = new Logout();
const PixflowAuth = require("postpace-auth-theme");
customElements.define("pixflow-auth", PixflowAuth);
const pixflow_auth = new PixflowAuth();
if(!pixflow_auth.redirect_panel_encrypt() || localStorage.getItem("token") == null)
    logout.submit_click();
const ExtUpdate = require("pixflow-extension-update");
require("pixflow-publish-year");
var fs = require("fs");
var path = require("path");
var os = require("os");
const platform = require("pixflow-os-platform")();
var https = require("https");
var AdmZip = require("adm-zip");
var version = cep_manifest.get_extension_version();
var host_env = JSON.parse(window.__adobe_cep__.getHostEnvironment());
var appName = host_env.appName;
var element_main = document.getElementById("main");
var element_categories = document.getElementById("categories");
var element_search = document.getElementById("search");
var element_block = document.getElementById("block");
var element_loading = document.querySelector("body > window-element.loading");
var element_custom_filter_button = document.getElementById("custom-filter-button");
var element_custom_filter = document.getElementById("custom-filter");
var element_categories_filter = document.getElementById("categories-filter");
var element_save_filter = document.getElementById("save-filter");
var element_library_button = document.getElementById("library-button");
var element_library = document.getElementById("library");
var element_library_pack = document.getElementById("library-pack");
var element_main_page = document.getElementById("main-page");
var element_user = document.getElementById("user");
var element_account = document.getElementById("account");
var element_go_premium = document.getElementById("go-premium");
var element_upgrade_planing = document.getElementById("upgrade-planning");
var element_tag_filter_button = document.getElementById("tag-filter-button");
var element_tag_filter = document.getElementById("tag-filter");
var element_app = document.getElementById(appName);
var element_get_started = document.getElementById("get-started");
var element_start_engine = document.getElementById("start-engine");
var element_engine_ai = document.getElementById("engine-ai");
var element_engine_ai_got_it = document.getElementById("engine-ai-got-it");
var element_search_tools = document.getElementById("search-tools");
var element_button_search = document.querySelector("#search-tools > button");
var btn_delete = document.querySelector("button.delete");
var offset = 0;
var inc = 70;
var limit = inc;
var items;
var is_generate_library = false;
document.querySelector("title").innerHTML = cep_manifest.get_extension_id();
document.querySelector("#upgrade-planning h2 > span").innerHTML = cep_manifest.get_extension_name();
const algoliasearch = require('algoliasearch');
const { URLSearchParams } = require("url");
const client = algoliasearch('WS11ARDO5G', '48829b548ffa121ed4b6e6462307b3f8');
const index = client.initIndex('pixflow_elements');
const index_trending = client.initIndex('pixflow_elements_trending');
var app_title = element_app.innerHTML;
var is_create_library = false;
var init_data;
var xhr_init_data = new XMLHttpRequest();
var query_data = new URLSearchParams({
    user_email_address: localStorage.getItem("email"),
    host: app_title,
    version_host: host_env.appVersion,
    os: platform,
    version_plugin: version,
    source: cep_manifest.get_source(),
    plugin_name: cep_manifest.get_extension_name()
}).toString();
var user_id = null;
var all_library = null;
var flag_download_stop = false;
var dl_req, dl_link;
var xhr_library = new XMLHttpRequest();
xhr_library.open("get", "https://pixflow.net/wp-content/uploads/px-element-cache/all.min.json");
xhr_library.send();
xhr_library.addEventListener("load", function(){
    all_library = JSON.parse(this.responseText);
});
xhr_init_data.open("post", `https://pixflow.net/wp-json/pixflow/get-mf-plugin-init-data-postpace-mode?${query_data}`);
xhr_init_data.setRequestHeader("pxAPIKey", "XxiSMuk@CVkYqJXhq04TevD5qXqsnDVyw3HWw");
xhr_init_data.addEventListener("load", function(){
    init_data = JSON.parse(this.responseText);
    document.querySelector("#account > div.profile > div > p.email").innerHTML = localStorage.getItem("email");
    document.querySelectorAll("#user > img.avatar, #account > div.profile > img").forEach(function(element){
        element.src = localStorage.getItem("avatar").indexOf("http") > 0 ? localStorage.getItem("avatar") : path.join(__dirname, "assets/images/default-avatar.svg");
    })
    document.querySelectorAll("#user > span, #account > div.profile > div > p.user").forEach(function(element){
        let fname = localStorage.getItem("first_name");
        let lname = localStorage.getItem("last_name");
        let full_name = "-";
        if(fname != "undefined" && lname != "undefined")
            full_name = `${fname} ${lname}`;
        element.innerHTML = full_name;
    })
    generate_checkbox(init_data["filters"]["fileTypes"], "file-type", 3);
    generate_checkbox(init_data["filters"]["quality"], "quality", 2);
    filter_params.px_element_file_type = init_data.filters.fileTypes;
    filter_view_extension(document.querySelector("#tag-filter > div.active").id == "tag-trending" ? index_trending : index);
    init_data["filters"]["categories"].forEach(function(category){
        var catpack = document.querySelector("#data > div.catpack").cloneNode(true);
        catpack.querySelector("span").innerHTML = category.title;
        catpack.querySelector("img").setAttribute("src", category.thumbnailURL);
        element_categories.appendChild(catpack);

        catpack = document.querySelector("#data > div.catpack").cloneNode(true);
        catpack.querySelector("span").innerHTML = category.title;
        catpack.querySelector("img").setAttribute("src", category.thumbnailURL);
        element_categories_filter.appendChild(catpack);
    })

    if(localStorage.getItem("postpace_user_type") == "premium"){
        document.querySelector("#download-center > div.premium").classList.add("active");
        document.querySelector("#download-center > div.free").classList.remove("active");
    }

    document.querySelector("#plan-review > div > p.plan").innerHTML = localStorage.getItem("postpace_user_type");
    
    document.querySelectorAll("#categories div.catpack div.catimg, #categories-filter div.catpack div.catimg, #categories > div > img, #categories-filter > div > img").forEach(function(element){
        element.addEventListener("click", function(){
            if(this.parentNode.classList.contains("active") == false){
                var catactive = document.querySelector("#categories div.catpack.active");
                catactive != null ? catactive.classList.remove("active") : undefined;
                var deselect_active = document.querySelector("#categories div.deselect.active");
                deselect_active != null ? deselect_active.classList.remove("active") : undefined;
                this.parentNode.classList.add("active");
                this.parentNode.querySelector("div.deselect").classList.add("active");
                if(element_search_tools.classList.contains("active")){
                    var obj = element.querySelector("img") instanceof Image ? element.querySelector("span") : this;
                    element_search.value = `${obj.innerHTML} `;
                }
                if(this.parentNode.parentNode.id == "categories"){
                    search_items(element_search);
                    block_click();
                    btn_delete.disabled = true;
                }
            }
        })
    })

    document.querySelectorAll("#categories div.catpack div.deselect, #categories-filter div.catpack div.deselect").forEach(function(element){
        element.addEventListener("click", function(){
            var category = this.parentNode.querySelector("span").innerHTML;
            var text_search = element_search.value;
            text_search = text_search.replace(`${category} `,"");
            element_search.value = text_search;
            this.classList.remove("active");
            this.parentNode.classList.remove("active");
            if(this.parentNode.parentNode.id == "categories"){
                search_items(element_search);
                block_click();    
            }
        })
    })

    document.querySelectorAll("#file-type div.extension, #quality div.extension").forEach(function(element){
        element.addEventListener("click", function(){
            var checkbox = this.querySelector("input");
            if(checkbox.checked)
                checkbox.checked = false;
            else
                checkbox.checked = true;
        })
    })

})
xhr_init_data.send();
var cmd;
switch(appName){
    case "AEFT":
    case "PPRO": cmd = "app.version"; break;
}
var filter_params = {
    search: "",
    optionalFilters: [
        "px_element_have_new_tag:true"
    ],
    px_element_softwares: [app_title],
    px_element_file_type: [],
    px_element_main_categories: [],
    px_element_video_qualities: [],
    px_element_free_item: false
}

var postpace_folder = os.homedir();
var folders = ["AppData", "Roaming", "Postpace"];
folders.forEach(function(value){
    postpace_folder = path.join(postpace_folder, value);
    if(fs.existsSync(postpace_folder) == false){
        fs.mkdirSync(postpace_folder);
    }    
})
var app_folder = postpace_folder;
var lut_folder = os.homedir();
folders = ["Documents", "Postpace", "LUTs"];
folders.forEach(function(value){
    lut_folder = path.join(lut_folder, value);
    if(fs.existsSync(lut_folder) == false){
        fs.mkdirSync(lut_folder);
    }    
})
document.getElementById("LUT").disabled = appName == "ILST";

element_app.disabled = false;

element_search.addEventListener("click", function(){
    element_categories.openWindow();
    element_block.openWindow();
    this.classList.add("active");
    element_custom_filter.closeWindow();
    element_tag_filter.closeWindow();
    element_tag_filter_button.classList.remove("active");
    element_custom_filter_button.classList.remove("active");
})

element_search_tools.addEventListener("click", function(){
    this.classList.add("active");
    if(element_search.value.length)
        btn_delete.disabled = false;
    else
        btn_delete.disabled = true;
})

element_button_search.addEventListener("click", function(){
    search_items(element_search);
    find_bubble(element_search.value.split(" "));
})

element_search.addEventListener("keypress", function(e){
    if(e.target.value.length)
        btn_delete.disabled = false;
    else
        btn_delete.disabled = true;
    if(e.key == "Enter"){
        search_items(this);
    }
    find_bubble(e.target.value.split(" "));
})

btn_delete.addEventListener("click", function(){
    element_search.value = "";
    this.disabled = true;
    var catpack_active = document.querySelector("#categories > div.catpack.active");
    if(catpack_active != null)
        catpack_active.classList.remove("active");
    search_items(element_search);
})

function closeAllWindow(element){
    var selector = [];
    if(element != undefined)
        selector.push(element);
    if(element_account.classList.contains("active"))
        selector.push("#account");
    if(selector.length)
        selector = `:not(${selector.join(",")})`;
    document.querySelectorAll(`window-element${selector}`).forEach(function(element){
        element.closeWindow();
    })
    btn_delete.disabled = true;
    if(element != "#library")
        element_library_button.classList.remove("active");
}

function block_click(){
    closeAllWindow();
    element_block.classList.remove("full-cover");
    element_search.value = filter_params.search;
    element_search_tools.classList.remove("active");
}

element_block.addEventListener("click", block_click)

element_custom_filter_button.addEventListener("click", function(){
    closeAllWindow("#block, #custom-filter");
    if(element_custom_filter.classList.contains("active")){
        element_block.closeWindow();
        element_custom_filter.closeWindow();
        this.classList.remove("active");
    } else {
        set_filter_params();
        element_block.openWindow();
        element_custom_filter.openWindow();
        this.classList.add("active");
    }
    element_search_tools.classList.remove("active");
    element_tag_filter_button.classList.remove("active");
    setTimeout(() => {
        if(element_custom_filter.classList.contains("active")){
            element_block.openWindow();
            element_custom_filter.openWindow();
        } else {
            element_block.closeWindow();
            element_custom_filter.closeWindow();
        }
    }, 50);
})

element_save_filter.addEventListener("click", function(){
    download_stop();
    filter_params.px_element_main_categories = [];
    document.querySelectorAll("#categories-filter div.catpack.active span").forEach(function(element){
        filter_params.px_element_main_categories.push(element.innerHTML);
    });
    filter_params.px_element_softwares = [];
    filter_params.px_element_softwares.push(element_app.innerHTML);
    filter_params.px_element_file_type = [];
    document.querySelectorAll("#file-type input:checked").forEach(function(element){
        filter_params.px_element_file_type.push(element.parentNode.querySelector("label").innerHTML);
    });
    filter_params.px_element_video_qualities = [];
    document.querySelectorAll("#quality input:checked").forEach(function(element){
        filter_params.px_element_video_qualities.push(element.parentNode.querySelector("label").innerHTML);
    })
    var count = document.querySelectorAll("#custom-filter div.catpack.active, #custom-filter input:checked").length;
    var element_plural = document.querySelector("#custom-filter-button > div > span.plural");
    var element_count = document.querySelector("#custom-filter-button > div > span.count");
    if(count){
        if(count > 1)
            element_plural.classList.add("active");
        else
            element_plural.classList.remove("active");
        element_count.innerHTML = count;
        element_count.classList.add("active");
    } else {
        element_plural.classList.remove("active");
        element_count.innerHTML = "";
        element_count.classList.remove("active");
    }
    filter_view_extension(document.querySelector("#tag-filter > div.active").id == "tag-trending" ? index_trending : index);
    element_custom_filter.closeWindow();
    element_block.closeWindow();
})

element_library_button.addEventListener("click", function(){
    closeAllWindow("#library");
    if(is_create_library == false){
        document.querySelectorAll("#library-pack > div.item").forEach(function(element){
            element.addEventListener("click", item_overall_click)
        })
        document.querySelectorAll("#library div.have-guide").forEach(function(element){
            element.addEventListener("click", have_guide_click)
        })
        document.querySelectorAll("#library-pack div.thumbnail").forEach(function(element){
            element.addEventListener("mouseenter", video_mouse_enter)
            element.addEventListener("mouseleave", video_mouse_leave)
        });
        document.querySelectorAll("#library-pack div.item div.download").forEach(function(element){
            element.addEventListener("click", download_click)
        })
        document.querySelectorAll("#library-pack > div.item > div.thumbnail").forEach(function(element){
            element.addEventListener("dblclick", video_dblclick)
        })
        is_create_library = true;
    }
    if(this.classList.contains("active")){
        this.classList.remove("active");
        element_library.closeWindow();
    } else {
        this.classList.add("active");
        element_library.openWindow();
    }
})

element_main_page.addEventListener("click", function(){
    closeAllWindow();
})

element_user.addEventListener("click", function(){
    closeAllWindow("#account");
    if(this.classList.contains("active")){
        this.classList.remove("active");
        element_account.closeWindow();
    }
    else {
        this.classList.add("active");
        closeAllWindow("#account");
        element_account.openWindow();
    }
})

function go_premium_click(){
    var selector = ["#upgrade-planning", "#block"];
    if(element_account.classList.contains("active"))
        selector.push("#account");
    closeAllWindow(selector.join(","));
    element_block.openWindow();
    element_block.classList.add("full-cover");
    element_upgrade_planing.openWindow();
}

element_go_premium.addEventListener("click", go_premium_click);

document.querySelectorAll("#upgrade-planning > div.close, #upgrade-planning > button, #engine-ai > div.close, #engine-ai-got-it").forEach(function(element){
    element.addEventListener("click", function(){
        block_click();
    })
})

document.querySelectorAll("#upgrade-planning > div.content > div > div.plan").forEach(function(element){
    element.addEventListener("click", function(){
        document.querySelector("#upgrade-planning > div.content > div > div.plan.active").classList.remove("active");
        this.classList.add("active");
    })
})

document.querySelector("#resource-menu li.logout").addEventListener("click", function(){
    document.querySelector("#account").appendChild(document.createElement("pixflow-logout"));
})

element_tag_filter_button.addEventListener("click", function(){
    closeAllWindow("#block, #tag-filter");
    if(element_tag_filter.classList.contains("active")){
        element_tag_filter.closeWindow();
        element_block.closeWindow();
        this.classList.remove("active");
    } else {
        element_tag_filter.openWindow();
        element_block.openWindow();
        this.classList.add("active");
    }
    element_categories.closeWindow();
    element_search_tools.classList.remove("active");
    element_custom_filter.closeWindow();
    element_custom_filter_button.classList.remove("active");
    setTimeout(() => {
        if(element_tag_filter.classList.contains("active")){
            element_block.openWindow();
        } else {
            element_block.closeWindow();
        }
    }, 50);
})

document.querySelectorAll("#tag-filter > div").forEach(function(element){
    element.addEventListener("click", function(){
        var index_switch = index;
        var optionalFilters = [];
        switch(this.id){
            case "tag-trending": index_switch = index_trending; break;
            default: optionalFilters[0] = "px_element_have_new_tag:true";
        }
        filter_params.optionalFilters = optionalFilters;
        if(this.id == "tag-free")
            filter_params.px_element_free_item = true;
        else
            filter_params.px_element_free_item = false;
        filter_view(index_switch, filter_params);
        document.querySelector("#tag-filter > div.active").classList.remove("active");
        element.classList.add("active");
        element_tag_filter_button.querySelector("div").innerHTML = element.querySelector(":first-child").innerHTML;
        element_tag_filter_button.classList.remove("active");
        element_tag_filter.closeWindow();
        element_block.closeWindow();
    })
})

element_get_started.addEventListener("click", function(){
    window.cep.util.openURLInDefaultBrowser(`https://postpace.io/pricing/?selected=${document.querySelector("#upgrade-planning div.plan.active").getAttribute("data-selected")}`);
})

element_start_engine.addEventListener("click", function(){
    closeAllWindow("#block, #engine-ai")
    element_block.openWindow();
    element_engine_ai.openWindow();
    element_block.classList.add("full-cover");
})

element_engine_ai_got_it.addEventListener("click", function(){
    element_engine_ai.closeWindow();
})

document.querySelectorAll(
    "#resource-menu > li:nth-child(1),"     /* Pixflow profile */
    + "#resource-menu > li:nth-child(2)"    /* License & Agreements */
).forEach(function(element){
    element.addEventListener("click", function(){
        window.cep.util.openURLInDefaultBrowser(this.getAttribute("link"));
    })
})

if(localStorage.getItem("port") == "postpace" && localStorage.getItem("postpace_user_type") == "premium"){
    document.querySelector("#go-premium").remove();
}
