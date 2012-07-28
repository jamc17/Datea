
window.Datea.MappingFormView = Backbone.View.extend({
	
	tagName: 'div',
	
	events: {
		'click .save-mapping': 'save_mapping',
		'shown [data-toggle="tab"]': 'attach_map'
	},

	initialize: function() {
		//this.model.bind("reset", this.render, this);
        //this.model.bind("sync", this.sync_event, this);
        
        if (this.model.attributes.item_categories) {
        	this.item_cat_col = new Datea.FreeCategoryCollection(this.model.attributes.item_categories);
        }else{
        	this.item_cat_col = new Datea.FreeCategoryCollection();
        }
  	},
	
	render: function(eventName) {
		this.$el.html(ich.fix_base_content_single_tpl());
		this.$el.find('#content').html( ich.mapping_form_tpl(this.model.toJSON()));
		
		// select category if set
		if (this.model.get('category')) {
			var $sel = this.$el.find('#id_category');
			Datea.set_select_control($sel, this.model.get('category').id);
		}
		
		// Item Categories
		var cat_items = [];
		
		var cat_view = new Datea.FreeCategoryEditListView({
			el: this.$el.find('#edit-mapping-categories'),
			model: this.item_cat_col,
		})
		cat_view.render();
		
		// MAPPING IMAGE
		var img = new Datea.Image();
		if (this.model.get('image')) img.set(this.model.get('image'));
		
		var self = this;
		var img_view = new Datea.ImageInputView({
			model: img, 
			callback: function(data){
				if (data.ok) {
					self.model.set({image: data.resource }, {silent: true});
				}
			} 
		});
		this.$el.find('#mapping-image-input-view').html(img_view.render().el);
		
		// mapping setting controls
		if (!Datea.my_user.isNew() &&
			( this.model.get('user').id == Datea.my_user.get('id')
			  || Datea.my_user.get('is_staff')
			)) {
			$('#setting-controls').html( ich.mapping_control_button_tpl(this.model.toJSON()));	
		}
		
		return this;	
	},
	
	save_mapping: function(ev) {
		ev.preventDefault();
		if (Datea.controls_validate(this.$el)){
			var hashtag = $('[name="hashtag"]', this.$el).val().replace('#','');
			var set_data = {
				name: $('[name="name"]', this.$el).val(),
				short_description: $('[name="short_description"]', this.$el).val(),
				mission: $('[name="mission"]', this.$el).val(),
				information_destiny: $('[name="information_destiny"]', this.$el).val(),
				category: $('[name="category"]', this.$el).val(),
				item_categories: this.item_cat_col.toJSON(),
				color: $('[name="color"]', this.$el).val(),
				hashtag: hashtag,
			}
			if (set_data['category'] == '') set_data['category'] = null;
			
			var is_new = this.model.isNew();
			var self = this;
			
			this.model.save(set_data,
				  {
					success: function(model, response){
						Datea.app.navigate('/mapping/'+model.attributes.id, {trigger: true});
						/*if (self.options.success_callback) self.options.success_callback();*/
					},
					error: function(model,response) {
						console.log("error")	
					}
			});
		}
	},
	
	attach_map: function (e) {
		
		if (typeof(e) != 'undefined' && e.currentTarget.hash == '#mapping-boundary' && !this.map_view) {
			this.map_view = new Datea.MapEditMultiLayerView({
				el: this.$el.find('#edit-mapping-position'),
				mapModel: this.model,
			});
			this.map_view.render();
		}
	},
	
});


window.Datea.MapEditMultiLayerView = Backbone.View.extend({
	
	render: function(){
		this.$el.html( ich.mapping_edit_boundary_tpl());
		
		var map = new olwidget.Map('map_edit_boundary', [
        	new olwidget.DateaEditableMultiLayer( this.options.mapModel, 'center', 
        		{
        		 'name': "Center", 'geometry': 'point', 'hideTextarea': false, 
        		 'overlayStyle': {'fillColor': "#ff0000", 'strokeColor': "#ff0000"},  
        		}
        	),
        	new olwidget.DateaEditableMultiLayer( this.options.mapModel, 'boundary', 
        		{'name': "Boundary", 'geometry': 'polygon', 'hideTextarea': false,
        		 'overlayStyle': {'fillColor': "#ecff00", 'strokeColor': "#ecff00"},  
  				}
        	),
    	], { 
    		'overlayStyle': { 'fillColor': "#ff0000" }, 
    		'layers': ['google.streets', 'google.hybrid'],
    		'mapDivStyle': {
                'width': '100%',
                'height': '550px'
            	}
    		}
    	);
    	return this;
	}
	
});