/**
 * Created by gospray on 17-2-16.
 */

(function (window,$) {
    var total_pages = +document.querySelector(".pagination").dataset.total_pages;
    var pageCount = 1;
    var state = 'finished';
    var scrollHandler = function(){
        if(pageCount+1 > total_pages){
            return;
        }

        if(state === 'finished') {
            if (window.innerHeight + window.pageYOffset + 600 > document.documentElement.offsetHeight) {
                toggleLoadingBar(true);

                LoadPage(++pageCount, function () {
                    toggleLoadingBar(false);
                    state = 'finished';
                });
            }
        }
    };

    scrollHandler();

    window.addEventListener('scroll',throttle(scrollHandler, 500));

    function toggleLoadingBar(arg){
        var loading = document.querySelector('.loading');
        if(arg === true){
            loading.style.cssText = 'display:block;';
        }else{
            loading.style.cssText = 'display:none;';
        }
    }

    function LoadPage(num, cb){
        state = 'loading';

        $.get("/page"+num, function(data){
            var page = document.createElement('div');
            page.innerHTML = data;
            var tmp = page.querySelector('.post-list');
            var postlist = document.querySelector('.post-list');

            postlist.appendChild(tmp);
            page = null;

            cb();
        });
    }

    /**
     * 函数节流
     * @param fn
     * @param interval
     * @returns {Function}
     */
    function throttle(fn, interval) {
        var _self = fn,
            timer,
            firstTime = true;

        return function () {
            var args = arguments,
                _me = this;

            if(firstTime){
                _self.apply(_me,args);
                return firstTime = false;
            }

            if(timer){
                return false;
            }

            timer = setTimeout(function () {
                _self.apply(_me,args);

                clearTimeout(timer); // 其实这两条语句在前在后没关系，因为function执行在javascript是原子的
                timer = null;
            }, interval || 500);

        };
    }
})(window,$);
