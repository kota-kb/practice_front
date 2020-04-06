$(function() {
   mainCtrl.init();
});

const API_HOST = 'http://localhost:8080';

/**
 * メイン制御
 */
const mainCtrl = {
   cat: {},

   /**
    * メイン初期化
    */
   init: function() {
      var this_ = this;
      $('#datetimepicker1').datetimepicker({
         format: 'YYYY-MM',
         viewMode: 'months',
         locale: 'ja',
         defaultDate: moment().format('YYYY-MM'),
      });
   
      var lastTs = 0;
      $('#datetimepicker1').on('change.datetimepicker',  function(e) {
         if (event.timeStamp - lastTs > 300) {
            var api = $(this).data('datetimepicker');
            this_.getData(api.date());
         }
         lastTs = event.timeStamp;
      });
   
      $('#btnOpenDetailModal').on('click', function(e) {
         modalCtrl.openModal('');
      });

      axios.get(API_HOST + '/api/categories')
      .then(function(res) {
         this_.cat = res.data;
      });

      modalCtrl.init();
      this_.getData(moment());
   },
   /**
    * サマリ情報セット
    * 
    * @param {*} data 
    */   
   setSummary: function(data) {
      if (!data) {
         data = {expense:0, balance:0, percentage:0};
      }

      $('#sumExpense').text('￥' + data.expense);
      $('#sumBalance').text('￥' + data.balance);
      $('#prgbarBalance').css('width',data.percentage + '%');
   },
   /**
    * 情報取得
    * @param {*} date 
    */
   getData: function(date) {
      var this_ = this;
      axios.get(API_HOST + '/api/summary',{
         params: {
            year: date.format('YYYY'),
            month: date.format('MM')
         }
      })
      .then(function (res) {
         this_.setSummary(res.data);
      })
      .catch(function(err) {
         console.log('err', err);
         this_.setSummary();
      });
      
      axios.get(API_HOST + '/api/details', {
         params: {
            year: date.format('YYYY'),
            month: date.format('MM')
         }
      })
      .then(function (res) {
         tablCtrl.setTableRows(res.data);
      })
   }

}

/**
 * テーブル制御
 */
const tablCtrl = {
   /**
    * テーブル内容セット
    * @param {*} data 
    */
   setTableRows: function(data) {
      $('#tbDetails').empty();
      var tmp = '<tr><td>{DATE}</td><td>{CATEGORY}</td><td class="text-right">{IN}</td><td class="text-right">{OUT}</td><td>{MEMO}</td><td><button class="btn btn-primary edit-detail" data-detail-id="{DETAIL_ID}"><i class="fas fa-edit"></i> 修正</button></td></tr>';
      data.forEach(function (r,i) {
         var row = tmp.replace('{DATE}', r.date)
         .replace('{CATEGORY}', r.category.name)
         .replace('{MEMO}', r.memo)
         .replace('{DETAIL_ID}', r.id);

         if (r.type.value === '1') {
            row = row.replace('{IN}', '￥' + r.amount).replace('{OUT}', '')
         } else {
            row = row.replace('{IN}', '').replace('{OUT}', '￥' + r.amount)
         }
         $('#tbDetails').append(row);
      });
      $('button.edit-detail').on('click', function(e) {
         modalCtrl.openModal($(this).data('detail-id'));
      });
   }
}

/**
 * モーダル制御
 */
const modalCtrl = {
   /**
    * モーダルオブジェクト
    */
   $mdl: $('#mdlDetail'),
   /**
    * カテゴリ選択セット
    * @param {*} type 
    */
   setCategoryList: function(type) {
      $('#fmrCategory').children().remove();
      mainCtrl.cat[type].forEach(c => {
         $('#fmrCategory').append($('<option value="' + c.value + '">' + c.name +'</option>'));
      })
   },

   /**
    * 初期化
    */
   init: function() {
      var this_ = this;

      $('#frmDate').datetimepicker({
         format: 'YYYY-MM-DD',
         viewMode: 'days',
         locale: 'ja',
      });
      $('input[name=frmType]').on('change', function(e) {
         this_.setCategoryList($('input[name=frmType]:checked').val());
      });

      const postProc = function(res) {
         var api = $('#datetimepicker1').data('datetimepicker');
         mainCtrl.getData(api.date());
         this_.$mdl.modal('hide');
      }

      $('#btnSave').on('click', function() {
         const data = {
            id: $('#detailId').val(),
            type: {value: $('input[name=frmType]:checked').val()},
            date: $('#frmDate').data('datetimepicker').date().format('YYYY-MM-DD'),
            category: { value: $('#fmrCategory').val()},
            amount: $('#frmAmount').val(),
            memo: $('#frmMemo').val()
         };

         console.log('send data:', data)
         if(data.id === '') {
            // 追加(detailIdが空の場合)
            axios.post(API_HOST + '/api/details', data)
               .then(function (res) {
                  postProc(res);
               });
         } else {
            // 修正
            axios.put(API_HOST + '/api/details/' + data.id, data)
               .then(function (res) {
                  postProc(res);
               });
         }
      });
   },

   /**
    * モーダル開く
    * @param {*} detailId 
    */
   openModal: function(detailId) {
      var this_ = this;

      const setForm = function(values) {
         $('#detailId').prop('value', values.id);
   
         var fmapi = $('#frmDate').data('datetimepicker');
         fmapi.minDate('1970-01-01');
         fmapi.maxDate('9999-12-31');
         fmapi.date(values.date);
         fmapi.minDate(moment(values.date).startOf('month').format('YYYY-MM-DD'));
         fmapi.maxDate(moment(values.date).endOf('month').format('YYYY-MM-DD'));
   
         switch(values.type) {
            case '1':
               $('#rdTypeIncome').prop('checked', true);
               break;
            case '2':
               $('#rdTypeExpense').prop('checked', true);
               break;
         }
         this_.setCategoryList(values.type);
         $('#fmrCategory option[value="' + values.category + '"]').prop('selected', true);
   
         $('#frmAmount').val(values.amount);
         $('#frmMemo').val(values.memo);
   
      }
   
      if(detailId === '') {
         // 追加(detailIdがundefinedの場合)
         var date = $("#datetimepicker1").find("input").val() + '-01';
         setForm({id: '', date: date, type: '1', category: '1', amount: 0, memo: ''});
      } else {
         // 修正
         axios.get(API_HOST + '/api/details/' + detailId)
         .then(function (res) {
            var data = res.data;
            setForm({id: data.id, date: data.date, type: data.type.value, category: data.category.value, amount: data.amount, memo: data.memo});
         });
      }
      modalCtrl.$mdl.modal('show');
   },
}
